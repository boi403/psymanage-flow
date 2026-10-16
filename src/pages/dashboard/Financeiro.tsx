import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { jsPDF } from "jspdf";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
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
  const [extratoMonth, setExtratoMonth] = useState(todayBRT().slice(0, 7));

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

  const paidReceita = tx.filter((t: any) => t.type === "receita" && t.status === "Pago");
  const earliestPaid = paidReceita.reduce((min: string | null, t: any) => (!min || t.due_date < min ? t.due_date : min), null as string | null);
  const daysElapsed = earliestPaid ? Math.max(1, (Date.now() - new Date(earliestPaid + "T12:00").getTime()) / 86_400_000) : 1;
  const mediaSemanal = recPago / Math.max(1, daysElapsed / 7);
  const mediaMensal = recPago / Math.max(1, daysElapsed / 30.44);

  const catColors = ["#00c2b2", "#0a8f7d", "#f59e0b", "#60a5fa", "#a78bfa", "#f472b6"];
  const byCategory = Object.entries(
    paidReceita.reduce((acc: Record<string, number>, t: any) => {
      const k = t.category || "Outros";
      acc[k] = (acc[k] ?? 0) + Number(t.amount);
      return acc;
    }, {})
  ).map(([name, value], i) => ({ name, value: value as number, color: catColors[i % catColors.length] }));

  const extrato = () => {
    const period = tx.filter((t: any) => t.due_date.slice(0, 7) === extratoMonth).sort((a: any, b: any) => a.due_date.localeCompare(b.due_date));
    const doc = new jsPDF();
    let y = 20;
    doc.setFontSize(16); doc.text("EXTRATO FINANCEIRO", 105, y, { align: "center" }); y += 9;
    doc.setFontSize(10);
    doc.text(`${profile?.full_name ?? ""}${profile?.crp ? ` · CRP ${profile.crp}` : ""}`, 105, y, { align: "center" }); y += 6;
    doc.text(`Período: ${extratoMonth}`, 105, y, { align: "center" }); y += 12;
    doc.setFontSize(9); doc.setFont("helvetica", "bold");
    doc.text("Data", 20, y); doc.text("Descrição", 48, y); doc.text("Status", 130, y); doc.text("Valor", 155, y); doc.text("Saldo", 180, y);
    doc.setFont("helvetica", "normal"); y += 4; doc.line(20, y, 195, y); y += 6;
    let saldo = 0;
    for (const t of period) {
      if (t.status === "Pago") saldo += t.type === "receita" ? Number(t.amount) : -Number(t.amount);
      if (y > 275) { doc.addPage(); y = 20; }
      doc.text(dateBR(t.due_date + "T12:00"), 20, y);
      doc.text((doc.splitTextToSize(t.description, 78) as string[])[0], 48, y);
      doc.text(t.status, 130, y);
      doc.text(`${t.type === "despesa" ? "-" : ""}${brl(t.amount)}`, 155, y);
      doc.text(brl(saldo), 180, y);
      y += 7;
    }
    if (!period.length) { doc.text("Nenhum lançamento neste período.", 20, y); y += 7; }
    y += 3; doc.line(20, y, 195, y); y += 8;
    doc.setFontSize(11); doc.text(`Saldo do período (pago): ${brl(saldo)}`, 20, y);
    doc.save(`extrato-${extratoMonth}.pdf`);
  };

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

      <div className="bg-card border border-border rounded-2xl p-6">
        <h2 className="font-bold text-foreground mb-1">PsicoBank — Médias e Extrato</h2>
        <p className="text-xs text-muted-foreground mb-5">Calculado a partir dos pagamentos já confirmados no Financeiro.</p>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Card icon={TrendingUp} label="Média semanal" value={brl(mediaSemanal)} sub="Recebido, média por semana" />
              <Card icon={TrendingUp} label="Média mensal" value={brl(mediaMensal)} sub="Recebido, média por mês" />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Input type="month" value={extratoMonth} onChange={(e) => setExtratoMonth(e.target.value)} className="w-44" />
              <Button variant="outline" size="sm" onClick={extrato}><FileText className="w-4 h-4 mr-1" /> Baixar extrato (PDF)</Button>
            </div>
          </div>
          <div className="h-48 flex items-center">
            {byCategory.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sem recebimentos confirmados ainda para montar o gráfico.</p>
            ) : (
              <div className="flex items-center gap-4 w-full">
                <div className="w-32 h-32 shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={byCategory} dataKey="value" nameKey="name" innerRadius={32} outerRadius={60} paddingAngle={2}>
                        {byCategory.map((c) => <Cell key={c.name} fill={c.color} />)}
                      </Pie>
                      <Tooltip formatter={(v: number) => brl(v)} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-1.5 min-w-0">
                  {byCategory.map((c) => (
                    <div key={c.name} className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: c.color }} />
                      <span className="truncate">{c.name}</span>
                      <span className="font-semibold text-foreground shrink-0">{brl(c.value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
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
