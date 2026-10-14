import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { jsPDF } from "jspdf";
import { TrendingUp, TrendingDown, DollarSign, Plus, Check, Trash2, FileText, Undo2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { brl, dateBR } from "@/lib/format";
import { Checkbox } from "@/components/ui/checkbox";
import { financialEditable } from "@/lib/clinical";
import { useAuth } from "@/hooks/useAuth";

const todayBRT = () => new Date().toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });

export default function Financeiro() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const [selected, setSelected] = useState<string[]>([]);
  const [editing, setEditing] = useState<{id:string;version:number}|null>(null);
  const [patientId,setPatientId]=useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ type: "receita", description: "", amount: "", due_date: todayBRT(), status: "Pendente", category: "" });

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id], enabled: !!user,
    queryFn: async () => (await supabase.from("profiles").select("full_name, crp").eq("id", user!.id).maybeSingle()).data,
  });

  const { data: tx = [] } = useQuery({
    queryKey: ["transactions"],
    queryFn: async () => (await supabase.from("transactions").select("*, patients(name)").order("due_date", { ascending: false })).data ?? [],
  });

  const {data:patients=[]}=useQuery({queryKey:["patients"],queryFn:async()=>(await supabase.from("patients").select("*").order("name")).data??[]});
  const create = useMutation({
    mutationFn: async () => {
      const payload={...form,amount:Number(form.amount),patient_id:patientId||null};
      const result=editing?await supabase.from("transactions").update(payload).eq("id",editing.id).eq("version",editing.version).select("id"):await supabase.from("transactions").insert(payload).select("id");
      const {error,data}=result;
      if(!error&&!data?.length) throw new Error("Lançamento alterado por outra operação. Atualize a página.");
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["transactions"] }); setOpen(false); toast.success("Lançamento salvo"); },
    onError: (e: Error) => toast.error(e.message),
  });
  const markPaid = useMutation({
    mutationFn: async ({ids,paid}:{ids:string[];paid:boolean}) => { const {error}=await supabase.rpc("settle_transactions",{_ids:ids,_paid:paid});if(error)throw error; },
    onSuccess: () => {setSelected([]);qc.invalidateQueries({ queryKey: ["transactions"] });qc.invalidateQueries({queryKey:["patient-finance"]});},
    onError:(e:Error)=>toast.error(e.message),
  });
  const remove = useMutation({
    mutationFn: async (id: string) => {const {error}=await supabase.from("transactions").delete().eq("id",id);if(error)throw error;},
    onSuccess: () => qc.invalidateQueries({ queryKey: ["transactions"] }),onError:(e:Error)=>toast.error(e.message),
  });

  const sum = (fn: (t: any) => boolean) => tx.filter(fn).reduce((a, t) => a + Number(t.amount), 0);
  const rec = sum((t) => t.type === "receita"), recPago = sum((t) => t.type === "receita" && t.status === "Pago");
  const desp = sum((t) => t.type === "despesa"), despPago = sum((t) => t.type === "despesa" && t.status === "Pago");

  const year = new Date().getFullYear();
  const months = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"].map((m, i) => {
    const inM = (t: any) => new Date(t.due_date + "T12:00").getFullYear() === year && new Date(t.due_date + "T12:00").getMonth() === i;
    return { m, r: sum((t) => t.type === "receita" && inM(t)), d: sum((t) => t.type === "despesa" && inM(t)) };
  });
  const max = Math.max(1, ...months.map((x) => Math.max(x.r, x.d)));

  const receipt = (t: any) => {
    const doc = new jsPDF();
    let y = 30;
    doc.setFontSize(16); doc.text("RECIBO", 105, y, { align: "center" }); y += 20;
    doc.setFontSize(11);
    for (const line of doc.splitTextToSize(`Recebi de ${t.patients?.name ?? "—"} a quantia de ${brl(t.amount)} referente a: ${t.description}.`, 170) as string[]) { doc.text(line, 20, y); y += 7; }
    y += 8;
    doc.text(`Data: ${dateBR((t.paid_at ?? t.due_date) + "T12:00")}`, 20, y); y += 30;
    doc.text("_______________________________", 20, y); y += 7;
    doc.text(profile?.full_name ?? "", 20, y); y += 7;
    doc.text(`CRP ${profile?.crp ?? ""}`, 20, y);
    doc.save(`recibo-${t.id}.pdf`);
  };

  const Card = ({ icon: Icon, label, value, sub }: any) => (
    <div className="bg-card border border-border rounded-2xl p-5">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-primary-light text-primary-dark"><Icon className="w-5 h-5" /></div>
        <p className="text-sm font-semibold text-foreground">{label}</p>
      </div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground mt-1">{sub}</p>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Financeiro</h1>
          <p className="text-muted-foreground text-sm mt-1">Receitas, despesas, cobranças e recibos.</p>
        </div>
        <Button onClick={() => {setEditing(null);setPatientId("");setForm({type:"receita",description:"",amount:"",due_date:todayBRT(),status:"Pendente",category:""});setOpen(true);}} className="gradient-primary text-primary-foreground"><Plus className="w-4 h-4 mr-2" /> Novo lançamento</Button>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Card icon={DollarSign} label="Resultado previsto" value={brl(rec - desp)} sub={`Resultado atual: ${brl(recPago - despPago)}`} />
        <Card icon={TrendingUp} label="Receitas" value={brl(rec)} sub={`Pago: ${brl(recPago)} · Pendente: ${brl(rec - recPago)}`} />
        <Card icon={TrendingDown} label="Despesas" value={brl(desp)} sub={`Pago: ${brl(despPago)} · A pagar: ${brl(desp - despPago)}`} />
      </div>

      <div className="bg-card border border-border rounded-2xl p-6">
        <h2 className="font-bold text-foreground mb-5">Resultado mensal — {year}</h2>
        <div className="flex items-end gap-2 h-48">
          {months.map((x) => (
            <div key={x.m} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full flex gap-0.5 items-end h-40">
                <div className="flex-1 bg-primary rounded-t" style={{ height: `${(x.r / max) * 100}%` }} title={brl(x.r)} />
                <div className="flex-1 bg-destructive/70 rounded-t" style={{ height: `${(x.d / max) * 100}%` }} title={brl(x.d)} />
              </div>
              <span className="text-[10px] text-muted-foreground font-medium">{x.m}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl">
        <div className="p-4 border-b border-border flex justify-between gap-3 flex-wrap"><h2 className="font-bold text-foreground">Lançamentos</h2><div className="flex gap-2"><Button size="sm" variant="outline" disabled={!selected.length||markPaid.isPending} onClick={()=>markPaid.mutate({ids:selected,paid:true})}>Baixar selecionados ({selected.length})</Button><Button size="sm" variant="outline" disabled={!selected.length||markPaid.isPending} onClick={()=>markPaid.mutate({ids:selected,paid:false})}>Desfazer baixa</Button></div></div>
        {tx.length === 0 && <p className="p-6 text-sm text-muted-foreground">Nenhum lançamento. Sessões marcadas como "Realizada" na agenda aparecem aqui automaticamente.</p>}
        {tx.map((t: any) => (
          <div key={t.id} className="flex items-center gap-3 p-4 border-b border-border last:border-0 flex-wrap">
            <Checkbox aria-label={`Selecionar ${t.description}`} disabled={!financialEditable(t.receipt_issued)} checked={selected.includes(t.id)} onCheckedChange={v=>setSelected(v?[...selected,t.id]:selected.filter(id=>id!==t.id))}/>
            <div className="flex-1 min-w-[160px]">
              <p className="text-sm font-semibold text-foreground">{t.description}</p>
              <p className="text-xs text-muted-foreground">{dateBR(t.due_date + "T12:00")} · {t.category ?? (t.type === "receita" ? "Receita" : "Despesa")}</p>
            </div>
            <span className={`text-sm font-bold ${t.type === "receita" ? "text-primary" : "text-destructive"}`}>{t.type === "despesa" && "- "}{brl(t.amount)}</span>
            <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${t.status === "Pago" ? "bg-primary-light text-primary-dark" : "bg-accent/15 text-accent"}`}>{t.status}</span>
            {t.status !== "Pago" && <Button disabled={t.receipt_issued||markPaid.isPending} size="sm" variant="outline" onClick={() => markPaid.mutate({ids:[t.id],paid:true})}><Check className="w-4 h-4 mr-1" /> Pago</Button>}
            {t.status === "Pago" && <Button disabled={t.receipt_issued||markPaid.isPending} size="icon" variant="ghost" title="Desfazer baixa" onClick={()=>markPaid.mutate({ids:[t.id],paid:false})}><Undo2 className="w-4 h-4"/></Button>}
             <Button disabled={t.receipt_issued} size="icon" variant="ghost" title="Editar lançamento" onClick={()=>{setEditing({id:t.id,version:t.version});setPatientId(t.patient_id||"");setForm({type:t.type,description:t.description,amount:String(t.amount),due_date:t.due_date,status:t.status,category:t.category||""});setOpen(true);}}><Pencil className="w-4 h-4"/></Button>
             {t.receipt_issued&&<span className="text-xs text-muted-foreground">Recibo fiscal emitido</span>}
             {t.type === "receita" && t.status === "Pago" && <Button size="sm" variant="ghost" onClick={() => receipt(t)}><FileText className="w-4 h-4 mr-1" /> Recibo</Button>}
            <Button disabled={t.receipt_issued} size="icon" variant="ghost" title="Excluir lançamento" onClick={() => confirm("Excluir?") && remove.mutate(t.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
          </div>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing?"Editar lançamento":"Novo lançamento"}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Tipo</Label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="receita">Receita</SelectItem><SelectItem value="despesa">Despesa</SelectItem></SelectContent>
              </Select>
            </div>
            <div><Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="Pendente">Pendente</SelectItem><SelectItem value="Pago">Pago</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="col-span-2"><Label>Paciente</Label><Select value={patientId||"none"} onValueChange={v=>setPatientId(v==="none"?"":v)}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="none">Sem paciente</SelectItem>{patients.map(p=><SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent></Select></div>
            <div className="col-span-2"><Label>Descrição</Label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
            <div><Label>Valor (R$)</Label><Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></div>
            <div><Label>Data</Label><Input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} /></div>
            <div className="col-span-2"><Label>Categoria</Label><Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Aluguel, Supervisão..." /></div>
          </div>
          <DialogFooter><Button disabled={!form.description || !form.amount || create.isPending} onClick={() => create.mutate()} className="gradient-primary text-primary-foreground">Salvar</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
