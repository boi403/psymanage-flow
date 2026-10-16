import { createClient } from 'npm:@supabase/supabase-js@2';
import { sendEmail } from './email.ts';
const BASE = 'https://connector-gateway.lovable.dev';
export const scopes = ['https://www.googleapis.com/auth/calendar.events'];
export const admin = () => {
 const url=Deno.env.get('SUPABASE_URL'),key=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
 if(!url||!key) throw new Error('Service configuration missing');
 return createClient(url,key);
};
async function cryptoKey() {
 const secret=Deno.env.get('APP_USER_CONNECTION_KEY_SECRET'); if(!secret) throw new Error('Connection encryption unavailable');
 return crypto.subtle.importKey('raw',Uint8Array.from(atob(secret),c=>c.charCodeAt(0)),'AES-GCM',false,['encrypt','decrypt']);
}
export async function encrypt(value:string) {
 const iv=crypto.getRandomValues(new Uint8Array(12)); const data=new Uint8Array(await crypto.subtle.encrypt({name:'AES-GCM',iv},await cryptoKey(),new TextEncoder().encode(value)));
 const out=new Uint8Array(iv.length+data.length);out.set(iv);out.set(data,12);return btoa(String.fromCharCode(...out));
}
export async function decrypt(value:string) {
 const data=Uint8Array.from(atob(value),c=>c.charCodeAt(0));return new TextDecoder().decode(await crypto.subtle.decrypt({name:'AES-GCM',iv:data.subarray(0,12)},await cryptoKey(),data.subarray(12)));
}
export async function gateway(path:string,init:RequestInit={},connection?:string,client?:string) {
 const key=Deno.env.get('LOVABLE_API_KEY');if(!key)throw new Error('Connexion Google indisponible');
 const headers=new Headers(init.headers);headers.set('Authorization',`Bearer ${key}`);headers.set('Content-Type','application/json');
 if(connection)headers.set('X-Connection-Api-Key',connection);if(client)headers.set('X-Client-Api-Key',client);
 if(path.startsWith('/google_calendar'))headers.set('X-Lovable-Required-Scopes',scopes.join(' '));
 return fetch(`${BASE}${path}`,{...init,headers});
}
export async function checked(response:Response) {
 if(!response.ok){const details=await response.text();console.error('Calendar provider',response.status,details);throw new Error(`Google Agenda (${response.status}): ${details}`);}
 return response.status===204?{}:response.json();
}
// deno-lint-ignore no-explicit-any
async function storeMeetUrlAndNotify(db:any, sessionId:string, meetUrl:string) {
 // Only the first time a session gets a Meet link do we e-mail the patient --
 // later re-syncs (e.g. the professional edits the time) reuse the same
 // meetUrl via the idempotent requestId, so this naturally only fires once.
 const {data:session,error}=await db.from('sessions').select('meet_url,confirmation_email_sent_at,starts_at,patient_id,user_id').eq('id',sessionId).maybeSingle();
 if(error||!session){if(error)console.error('Failed to load session for meet_url update',sessionId,error);return;}
 const alreadyHadLink=!!session.meet_url;
 const {error:updErr}=await db.from('sessions').update({meet_url:meetUrl}).eq('id',sessionId);
 if(updErr){console.error('Failed to store meet_url',sessionId,updErr);return;}
 if(alreadyHadLink||session.confirmation_email_sent_at)return;
 const [{data:patient},{data:profile}]=await Promise.all([
  db.from('patients').select('name,email').eq('id',session.patient_id).maybeSingle(),
  db.from('profiles').select('full_name').eq('id',session.user_id).maybeSingle(),
 ]);
 if(!patient?.email)return;
 const when=new Date(session.starts_at).toLocaleString('pt-BR',{timeZone:'America/Sao_Paulo',dateStyle:'full',timeStyle:'short'});
 const proName=profile?.full_name||'seu profissional';
 const html=`<p>Olá, ${patient.name ?? ''}!</p><p>Sua consulta com <strong>${proName}</strong> está confirmada para <strong>${when}</strong> (horário de Brasília).</p><p>Link da videochamada (Google Meet): <a href="${meetUrl}">${meetUrl}</a></p><p>Qualquer dúvida, entre em contato diretamente com seu profissional.</p>`;
 const sent=await sendEmail(patient.email,'Consulta confirmada - link da videochamada',html);
 if(sent)await db.from('sessions').update({confirmation_email_sent_at:new Date().toISOString()}).eq('id',sessionId);
}

export async function syncUser(userId:string) {
 const db=admin();const {data:conn,error}=await db.from('app_user_connections').select('*').eq('user_id',userId).eq('connector_id','google_calendar').maybeSingle();
 if(error)throw error;if(!conn||conn.reconnect_required)return;
 const key=await decrypt(conn.connection_key_ciphertext);
 // Filter to pending jobs in SQL (version<>synced_version), not after an
 // ORDER BY updated_at LIMIT 100 -- otherwise already-synced rows (whose
 // updated_at never advances) can permanently fill the window and starve
 // new jobs once a user has more than 100 historic sessions.
 const {data:jobs,error:jobError}=await db.rpc('get_pending_calendar_jobs',{_user_id:userId,_limit:200});
 if(jobError)throw jobError;
 for(const job of jobs??[]) {
  const eventId=`psico${job.session_id.replaceAll('-','')}`;
  // conferenceDataVersion=1 is required by the Calendar API for the server to
  // honor conferenceData.createRequest at all. Reusing the same requestId
  // (the deterministic eventId) on every update is the documented pattern
  // for making the Meet-creation request idempotent across repeated syncs of
  // the same session, instead of spawning a new Meet link each time.
  const path=`/google_calendar/calendar/v3/calendars/primary/events/${eventId}?conferenceDataVersion=1`;
  const payload={id:eventId,summary:'Consulta · PsicoManager',visibility:'private',status:job.cancelled?'cancelled':'confirmed',start:{dateTime:job.starts_at},end:{dateTime:new Date(new Date(job.starts_at).getTime()+job.duration_min*60000).toISOString()},description:'Consulta agendada no PsicoManager. Alterações devem ser feitas no PsicoManager.',...(job.cancelled?{}:{conferenceData:{createRequest:{requestId:eventId,conferenceSolutionKey:{type:'hangoutsMeet'}}}})};
  try {
   let response=await gateway(path,{method:job.cancelled?'DELETE':'PUT',...(job.cancelled?{}:{body:JSON.stringify(payload)})},key);
   if(response.status===401){const body=await response.clone().json().catch(()=>null);if(typeof body?.type==='string'&&body.type.startsWith('credential_')){await db.from('app_user_connections').update({reconnect_required:true}).eq('id',conn.id);return;}}
   if(!job.cancelled&&response.status===404)response=await gateway(`/google_calendar/calendar/v3/calendars/primary/events?conferenceDataVersion=1`,{method:'POST',body:JSON.stringify(payload)},key);
   // A concurrent sync run (e.g. a manual "Sincronizar agora" overlapping the
   // worker) may have already created this event: 409 on create is a benign
   // race, not a failure -- treat it as success instead of aborting the loop.
   const benign=job.cancelled?(response.status===404||response.status===410):response.status===409;
   let meetUrl:string|undefined;
   if(!benign){
    const body=await checked(response);
    meetUrl=typeof body?.hangoutLink==='string'?body.hangoutLink:undefined;
   }
   const {error}=await db.from('calendar_sync_jobs').update({synced_version:job.version,last_error:null}).eq('id',job.id).eq('version',job.version);if(error)throw error;
   // Only ever set meet_url, never clear it on a benign/no-op response (e.g. a
   // 409 race) where we didn't get a fresh body back with the link.
   if(!job.cancelled&&meetUrl)await storeMeetUrlAndNotify(db,job.session_id,meetUrl);
  } catch(e){
   // Don't let one bad job (e.g. a malformed payload the provider always
   // rejects) abort every later job for this user -- record it and move on.
   await db.from('calendar_sync_jobs').update({last_error:'Não foi possível sincronizar com o Google Agenda.'}).eq('id',job.id);
   console.error('Calendar job sync failed',job.id,e);
  }
 }
}
