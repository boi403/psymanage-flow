import { useState,useEffect } from 'react';
import { useQuery,useMutation,useQueryClient } from '@tanstack/react-query';
import { Save,Plus,Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { ReceitaSaudePanel } from '@/components/dashboard/ReceitaSaudePanel';
import { CLINICAL_FIELDS,FIELD_LABELS } from '@/lib/clinical';
import { isValidCPF } from '@/lib/receita';
export default function Configuracao(){
 const {user}=useAuth();const qc=useQueryClient();
 const [form,setForm]=useState({full_name:'',crp:'',specialty:'',professional_cpf:'',city:'',phone:'',default_session_price:'0'});const [templates,setTemplates]=useState<Record<string,Record<string,string>>>({});const [newApproach,setNewApproach]=useState('');
 const {data:profile,isLoading}=useQuery({queryKey:['settings',user?.id],enabled:!!user,queryFn:async()=>{if(!user)return null;const {data,error}=await supabase.from('profiles').select('*').eq('id',user.id).single();if(error)throw error;return data;}});
 useEffect(()=>{if(profile){setForm({full_name:profile.full_name??'',crp:profile.crp??'',specialty:profile.specialty??'',professional_cpf:profile.professional_cpf??'',city:profile.city??'',phone:profile.phone??'',default_session_price:String(profile.default_session_price)});setTemplates((profile.approach_templates??{}) as Record<string,Record<string,string>>);}},[profile]);
 const save=useMutation({mutationFn:async()=>{
  if(!user)throw new Error('Entre na sua conta');
  if(form.professional_cpf.trim()&&!isValidCPF(form.professional_cpf))throw new Error('CPF do profissional inválido');
  const {error}=await supabase.from('profiles').update({...form,default_session_price:Number(form.default_session_price),approach_templates:templates}).eq('id',user.id);if(error)throw error;
 },onSuccess:()=>{qc.invalidateQueries({queryKey:['settings']});qc.invalidateQueries({queryKey:['clinical-settings']});toast.success('Configurações salvas');},onError:(e:Error)=>toast.error(e.message)});
 const missing=profile&&(!profile.crp||!profile.specialty);
 return <div className="space-y-6">{missing&&<div role="alert" className="bg-accent/15 border border-accent text-accent-foreground rounded-xl p-4 text-sm">Complete seu CRP e especialidade abaixo — alguns recursos (como o Receita Saúde) exigem esses dados. {!profile?.crp&&!profile?.specialty?'Isso é comum para quem entrou com o Google, já que o Google não informa esses dados.':''}</div>}<div className="flex justify-between gap-4 items-center"><h1 className="text-2xl font-bold">Configurações</h1><Button disabled={save.isPending||isLoading} onClick={()=>save.mutate()}><Save className="w-4 h-4 mr-2"/>Salvar</Button></div><section className="space-y-4"><h2 className="font-bold text-lg">Dados do profissional</h2><div className="grid md:grid-cols-2 gap-4">{([{key:'full_name',label:'Nome'},{key:'crp',label:'CRP'},{key:'specialty',label:'Especialidade'},{key:'professional_cpf',label:'CPF (para recibos Receita Saúde)'},{key:'city',label:'Cidade'},{key:'phone',label:'Contato'},{key:'default_session_price',label:'Valor padrão da sessão (R$)'}] as const).map(f=><div key={f.key}><Label>{f.label}</Label><Input type={f.key==='default_session_price'?'number':'text'} min={0} value={form[f.key]} onChange={e=>setForm({...form,[f.key]:e.target.value})}/></div>)}</div></section><section className="border-t border-border pt-6 space-y-4"><h2 className="font-bold text-lg">Abordagens terapêuticas</h2><div className="flex gap-2"><Input placeholder="TCC, Psicologia Positiva, Logoterapia..." value={newApproach} onChange={e=>setNewApproach(e.target.value)}/><Button disabled={!newApproach.trim()} variant="outline" onClick={()=>{setTemplates({...templates,[newApproach.trim()]:{}});setNewApproach('');}}><Plus className="w-4 h-4 mr-1"/>Adicionar</Button></div>{Object.entries(templates).map(([name,fields])=><details key={name} className="border-b border-border pb-4"><summary className="font-semibold cursor-pointer">{name}</summary><div className="grid md:grid-cols-2 gap-3 mt-3">{CLINICAL_FIELDS.map(k=><div key={k}><Label>{FIELD_LABELS[k]}</Label><Textarea rows={2} value={fields[k]??''} onChange={e=>setTemplates({...templates,[name]:{...fields,[k]:e.target.value}})}/></div>)}</div><Button variant="ghost" size="sm" onClick={()=>{const next={...templates};delete next[name];setTemplates(next);}}><Trash2 className="w-4 h-4 mr-1"/>Remover abordagem</Button></details>)}</section><ReceitaSaudePanel/></div>;
}
