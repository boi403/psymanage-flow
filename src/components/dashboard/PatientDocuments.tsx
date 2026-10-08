import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Copy, Download, Lock, Save } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { toast } from 'sonner';
import { downloadClinicalPDF, documentEditable } from '@/lib/clinical';
import type { Tables } from '@/integrations/supabase/types';
const kinds=['Declaração','Atestado','Relatório','Laudo','Parecer'];
const sections='Identificação\n\nDescrição da demanda\n\nProcedimentos\n\nAnálise\n\nConclusão\n\nLocal, data e assinatura do profissional';
export function PatientDocuments({patient}:{patient:Tables<'patients'>}) {
 const qc=useQueryClient(); const [editing,setEditing]=useState<Tables<'psychological_documents'>|null>(null); const [creating,setCreating]=useState(false);
 const [form,setForm]=useState({kind:'Declaração',title:'',content:''});
 const {data:docs=[]}=useQuery({queryKey:['documents',patient.id],queryFn:async()=>{const {data,error}=await supabase.from('psychological_documents').select('*').eq('patient_id',patient.id).order('created_at',{ascending:false});if(error)throw error;return data;}});
 const save=useMutation({mutationFn:async(finalize:boolean)=>{
 if(finalize && !confirm('Finalizar este documento? Ele não poderá ser alterado ou excluído.')) return false;
 const payload={...form,patient_id:patient.id,status:finalize?'final':'rascunho'};
 const {error}=editing?await supabase.from('psychological_documents').update(payload).eq('id',editing.id):await supabase.from('psychological_documents').insert(payload);if(error)throw error;return true;
 },onSuccess:(saved)=>{if(!saved)return;qc.invalidateQueries({queryKey:['documents',patient.id]});setCreating(false);setEditing(null);toast.success('Documento salvo');},onError:(e:Error)=>toast.error(e.message)});
 const duplicate=useMutation({mutationFn:async(d:Tables<'psychological_documents'>)=>{const {error}=await supabase.from('psychological_documents').insert({patient_id:patient.id,kind:d.kind,title:d.title+' — nova versão',content:d.content,source_id:d.id});if(error)throw error;},onSuccess:()=>qc.invalidateQueries({queryKey:['documents',patient.id]}),onError:(e:Error)=>toast.error(e.message)});
 return <div className="space-y-4"><div className="flex justify-between items-center"><h3 className="font-semibold">Documentos psicológicos</h3><Button size="sm" onClick={()=>{setEditing(null);setForm({kind:'Declaração',title:'',content:sections});setCreating(true);}}><Plus className="w-4 h-4 mr-1"/>Novo documento</Button></div>
 {(creating||editing)&&<div className="space-y-3 border-b border-border pb-5"><div className="grid grid-cols-2 gap-3"><div><Label>Tipo</Label><Select value={form.kind} onValueChange={kind=>setForm({...form,kind})}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{kinds.map(k=><SelectItem key={k} value={k}>{k}</SelectItem>)}</SelectContent></Select></div><div><Label>Título</Label><Input value={form.title} onChange={e=>setForm({...form,title:e.target.value})}/></div></div><Label>Conteúdo</Label><Textarea rows={12} value={form.content} onChange={e=>setForm({...form,content:e.target.value})}/><div className="flex gap-2 flex-wrap"><Button disabled={!form.title.trim()||save.isPending} onClick={()=>save.mutate(false)}><Save className="w-4 h-4 mr-1"/>Salvar rascunho</Button><Button variant="outline" disabled={!form.title.trim()||!form.content.trim()||save.isPending} onClick={()=>save.mutate(true)}><Lock className="w-4 h-4 mr-1"/>Finalizar</Button><Button variant="ghost" onClick={()=>{setCreating(false);setEditing(null);}}>Cancelar</Button></div></div>}
 {!docs.length&&<p className="text-sm text-muted-foreground">Nenhum documento.</p>}{docs.map(d=><div key={d.id} className="border-b border-border py-3"><div className="flex justify-between items-start gap-3 flex-wrap"><div><p className="font-semibold">{d.title}</p><p className="text-xs text-muted-foreground">{d.kind} · {d.status==='final'?'Finalizado':'Rascunho'}</p></div><div className="flex gap-1">{documentEditable(d.status)&&<Button size="sm" variant="outline" onClick={()=>{setCreating(false);setEditing(d);setForm({kind:d.kind,title:d.title,content:d.content});}}>Editar</Button>}<Button size="icon" variant="ghost" title="Duplicar para nova versão" onClick={()=>duplicate.mutate(d)}><Copy className="w-4 h-4"/></Button><Button size="icon" variant="ghost" title="Baixar PDF" onClick={()=>downloadClinicalPDF(d.title,`Paciente: ${patient.name}\n${d.status==='rascunho'?'RASCUNHO — não finalizado\n':''}\n${d.content}`)}><Download className="w-4 h-4"/></Button></div></div><details className="mt-2 text-sm"><summary className="cursor-pointer text-muted-foreground">Conteúdo</summary><p className="whitespace-pre-wrap mt-2">{d.content}</p></details></div>)}</div>;
}
