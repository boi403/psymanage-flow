import { createClient } from 'npm:@supabase/supabase-js@2';
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
export async function syncUser(userId:string) {
 const db=admin();const {data:conn,error}=await db.from('app_user_connections').select('*').eq('user_id',userId).eq('connector_id','google_calendar').maybeSingle();
 if(error)throw error;if(!conn||conn.reconnect_required)return;
 const key=await decrypt(conn.connection_key_ciphertext);
 const {data:jobs,error:jobError}=await db.from('calendar_sync_jobs').select('*').eq('user_id',userId).order('updated_at').limit(100);
 if(jobError)throw jobError;
 for(const job of jobs??[]) {
  if(job.version===job.synced_version)continue;
  const eventId=`psico${job.session_id.replaceAll('-','')}`;
  const path=`/google_calendar/calendar/v3/calendars/primary/events/${eventId}`;
  const payload={id:eventId,summary:'Consulta · PsicoManager',visibility:'private',start:{dateTime:job.starts_at},end:{dateTime:new Date(new Date(job.starts_at).getTime()+job.duration_min*60000).toISOString()},description:'Consulta agendada no PsicoManager. Alterações devem ser feitas no PsicoManager.'};
  try {
   let response=await gateway(path,{method:job.cancelled?'DELETE':'PUT',...(job.cancelled?{}:{body:JSON.stringify(payload)})},key);
   if(response.status===401){const body=await response.clone().json().catch(()=>null);if(typeof body?.type==='string'&&body.type.startsWith('credential_')){await db.from('app_user_connections').update({reconnect_required:true}).eq('id',conn.id);return;}}
   if(!job.cancelled&&response.status===404)response=await gateway('/google_calendar/calendar/v3/calendars/primary/events',{method:'POST',body:JSON.stringify(payload)},key);
   if(!(job.cancelled&&(response.status===404||response.status===410)))await checked(response);
   const {error}=await db.from('calendar_sync_jobs').update({synced_version:job.version,last_error:null}).eq('id',job.id).eq('version',job.version);if(error)throw error;
  } catch(e){await db.from('calendar_sync_jobs').update({last_error:'Não foi possível sincronizar com o Google Agenda.'}).eq('id',job.id);throw e;}
 }
}
