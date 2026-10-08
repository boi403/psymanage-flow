import {createClient} from 'npm:@supabase/supabase-js@2';
import {corsHeaders} from 'npm:@supabase/supabase-js@2/cors';
const json=(v:unknown,status=200)=>new Response(JSON.stringify(v),{status,headers:{...corsHeaders,'Content-Type':'application/json'}});
Deno.serve(async req=>{
 if(req.method==='OPTIONS')return new Response('ok',{headers:corsHeaders});
 if(req.method!=='POST')return json({error:'Método inválido'},405);
 const auth=req.headers.get('Authorization');if(!auth)return json({error:'Entre na sua conta'},401);
 const client=createClient(Deno.env.get('SUPABASE_URL')??'',Deno.env.get('SUPABASE_ANON_KEY')??'',{global:{headers:{Authorization:auth}}});
 const {data,error}=await client.auth.getUser();if(error||!data.user)return json({error:'Entre na sua conta'},401);
 const admin=createClient(Deno.env.get('SUPABASE_URL')??'',Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')??'');
 const token=Array.from(crypto.getRandomValues(new Uint8Array(32)),b=>b.toString(16).padStart(2,'0')).join('');
 const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(token))),b=>b.toString(16).padStart(2,'0')).join('');
 const {error:err}=await admin.from('bot_tokens').insert({user_id:data.user.id,token_hash:hash});if(err)return json({error:'Não foi possível criar o token'},500);
 return json({token});
});
