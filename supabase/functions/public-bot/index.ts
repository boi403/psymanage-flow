import {createClient} from 'npm:@supabase/supabase-js@2';
import {corsHeaders} from 'npm:@supabase/supabase-js@2/cors';
import {z} from 'npm:zod@3';
const json=(v:unknown,status=200)=>new Response(JSON.stringify(v),{status,headers:{...corsHeaders,'Content-Type':'application/json'}});
const schema=z.object({action:z.enum(['link','pending','record','settle']),code:z.string().uuid().optional(),chat_id:z.string().min(1).max(80).optional(),patient_id:z.string().uuid().optional(),content:z.string().min(1).max(60000).optional(),count:z.number().int().min(1).max(200).optional(),amount:z.number().positive().optional()}).strict();
Deno.serve(async req=>{
 if(req.method==='OPTIONS')return new Response('ok',{headers:corsHeaders});
 if(req.method!=='POST')return json({error:'Método inválido'},405);
 const token=req.headers.get('Authorization')?.replace(/^Bearer /,'');if(!token||token.length!==64)return json({error:'Token inválido'},401);
 const admin=createClient(Deno.env.get('SUPABASE_URL')??'',Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')??'');
 const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(token))),b=>b.toString(16).padStart(2,'0')).join('');
 const {data:owner}=await admin.from('bot_tokens').select('user_id,expires_at').eq('token_hash',hash).maybeSingle();if(!owner)return json({error:'Token inválido'},401);
 if(owner.expires_at&&new Date(owner.expires_at).getTime()<=Date.now())return json({error:'Token expirado'},401);
 await admin.from('bot_tokens').update({last_used_at:new Date().toISOString()}).eq('token_hash',hash).then(()=>{},()=>{});
 const parsed=schema.safeParse(await req.json().catch(()=>null));if(!parsed.success)return json({error:'Dados inválidos'},400);
 const b=parsed.data;
 const {data,error}=await admin.rpc('bot_operation',{_owner:owner.user_id,_action:b.action,_code:b.code??null,_chat:b.chat_id??null,_patient:b.patient_id??null,_content:b.content??null,_count:b.count??null,_amount:b.amount??null});
 if(error){
  console.error('bot_operation error',error);
  // P0001 is a deliberate RAISE EXCEPTION inside bot_operation with a
  // user-facing Portuguese message; anything else (constraint violations,
  // connection errors, etc.) must not leak internal details to the bot.
  return json({error:error.code==='P0001'?error.message:'Operação inválida'},400);
 }
 return json(data);
});
