import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { z } from 'npm:zod@3';
import { admin, gateway, checked, encrypt, decrypt, scopes, syncUser } from '../_shared/calendar-connector.ts';
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{...corsHeaders,'Content-Type':'application/json'}});
Deno.serve(async req=>{
 if(req.method==='OPTIONS')return new Response('ok',{headers:corsHeaders});
 if(req.method!=='POST')return json({error:'Método não permitido'},405);
 try {
  const url=Deno.env.get('SUPABASE_URL'),anon=Deno.env.get('SUPABASE_ANON_KEY');if(!url||!anon)throw new Error('Configuração indisponível');
  const input=z.object({action:z.enum(['status','start','complete','disconnect','sync','worker']),origin:z.string().url().optional(),code:z.string().min(1).max(4096).optional()}).strict().safeParse(await req.json().catch(()=>null));
  if(!input.success)return json({error:'Solicitação inválida'},400);
  const db=admin();const {action}=input.data;
  if(action==='worker'){
   const {data}=await db.from('calendar_worker_secret').select('secret').eq('id',1).maybeSingle();
   if(!data||req.headers.get('X-Calendar-Worker')!==data.secret)return json({error:'Não autorizado'},401);
   const {data:connections}=await db.from('app_user_connections').select('user_id').eq('connector_id','google_calendar').eq('reconnect_required',false).limit(500);
   for(const conn of connections??[]){try{await syncUser(conn.user_id);}catch(e){console.error('Calendar sync failed',e);}}
   return json({ok:true});
  }
  const authorization=req.headers.get('Authorization');if(!authorization)return json({error:'Entre na sua conta'},401);
  const client=createClient(url,anon,{global:{headers:{Authorization:authorization}}});
  const {data:{user}}=await client.auth.getUser();if(!user)return json({error:'Entre na sua conta'},401);
  const {data:conn,error}=await db.from('app_user_connections').select('*').eq('user_id',user.id).eq('connector_id','google_calendar').maybeSingle();if(error)throw error;
  if(action==='status')return json({connected:!!conn,reconnectRequired:conn?.reconnect_required??false});
  if(action==='start'){
   const origin=input.data.origin;if(!origin||origin!==req.headers.get('Origin')||new URL(origin).origin!==origin||(!origin.startsWith('https://')&&origin!=='http://localhost:8080'))return json({error:'Origem inválida'},400);
   const clientKey=Deno.env.get('GOOGLE_CALENDAR_APP_USER_CONNECTOR_CLIENT_API_KEY');if(!clientKey)return json({error:'Configure a conexão Google Agenda no Lovable'},503);
   const response=await checked(await gateway('/api/v1/app-users/oauth2/authorize',{method:'POST',body:JSON.stringify({connector_id:'google_calendar',app_user_id:user.id,return_url:`${origin}/oauth/google-calendar/return`,credentials_configuration:{scopes}})},conn?await decrypt(conn.connection_key_ciphertext):undefined,clientKey));
   return json({authorizationUrl:response.authorization_url});
  }
  if(action==='complete'){
   if(!input.data.code)return json({error:'Código ausente'},400);
   const result=await checked(await gateway('/api/v1/app-users/oauth2/exchange',{method:'POST',body:JSON.stringify({code:input.data.code})}));
   if(result.connector_id!=='google_calendar'||typeof result.api_key!=='string')return json({error:'Conexão inválida'},400);
   const {error}=await db.from('app_user_connections').upsert({user_id:user.id,connector_id:'google_calendar',connection_key_ciphertext:await encrypt(result.api_key),reconnect_required:false,updated_at:new Date().toISOString()},{onConflict:'user_id,connector_id'});if(error)throw error;
   const {data:sessions,error:sessionError}=await client.from('sessions').select('id,user_id,starts_at,duration_min,status');if(sessionError)throw sessionError;
   const jobs=(sessions??[]).map(s=>({user_id:user.id,session_id:s.id,starts_at:s.starts_at,duration_min:s.duration_min,cancelled:s.status==='Cancelada'}));
   if(jobs.length){const {error}=await db.from('calendar_sync_jobs').upsert(jobs,{onConflict:'session_id',ignoreDuplicates:true});if(error)throw error;}
   return json({ok:true});
  }
  if(action==='disconnect'){
   if(conn){await checked(await gateway('/api/v1/app-users/connection',{method:'DELETE',body:JSON.stringify({connector_id:'google_calendar'})},await decrypt(conn.connection_key_ciphertext)));const {error}=await db.from('app_user_connections').delete().eq('id',conn.id);if(error)throw error;await db.from('calendar_sync_jobs').update({synced_version:0}).eq('user_id',user.id);}
   return json({ok:true});
  }
  await syncUser(user.id);return json({ok:true});
 }catch(e){return json({error:e instanceof Error?e.message:'Falha na conexão'},502);}
});
