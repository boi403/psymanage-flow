import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { TrendingUp, TrendingDown, DollarSign, Plus, Check, Trash2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { brl, dateBR } from "@/lib/format";
import { useAuth } from "@/hooks/useAuth";

export default function Financeiro() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ type: "receita", description: "", amount: "", due_date: new Date().toISOString().slice(0, 10), status: "Pendente", category: "" });

  const { data: tx = [] } = useQuery({
    queryKey: ["transactions"],
    queryFn: async () => (await supabase.from("transactions").select("*, patients(name)").order("due_date", { ascending: false })).data ?? [],
  });

  const create = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("transactions").insert({ ...form, amount: Number(form.amount) });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["transactions"] }); setOpen(false); toast.success("Lançamento salvo"); },
    onError: (e: Error) => toast.error(e.message),
  });
  const markPaid = useMutation({
    mutationFn: async (id: string) => { await supabase.from("transactions").update({ status: "Pago" }).eq("id", id); },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["transactions"] }),
  });
  const remove = useMutation({
    mutationFn: async (id: string) => { await supabase.from("transactions").delete().eq("id", id); },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["transactions"] }),
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
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(`<html><head><title>Recibo</title></head><body style="font-family:sans-serif;padding:40px;max-width:600px;margin:auto">
      <h2>RECIBO</h2><p>Recebi de <b>${t.patients?.name ?? "—"}</b> a quantia de <b>${brl(t.amount)}</b>
      referente a: ${t.description}.</p><p>Data: ${dateBR(t.due_date + "T12:00")}</p>
      <br/><br/><p>_______________________________<br/>${user?.user_metadata?.full_name ?? ""}<br/>CRP ${user?.user_metadata?.crp ?? ""}</p>
      <script>window.print()</script></body></html>`);
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
        <Button onClick={() => setOpen(true)} className="gradient-primary text-primary-foreground"><Plus className="w-4 h-4 mr-2" /> Novo lançamento</Button>
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
        <h2 className="font-bold p-4 border-b border-border text-foreground">Lançamentos</h2>
        {tx.length === 0 && <p className="p-6 text-sm text-muted-foreground">Nenhum lançamento. Sessões marcadas como "Realizada" na agenda aparecem aqui automaticamente.</p>}
        {tx.map((t: any) => (
          <div key={t.id} className="flex items-center gap-3 p-4 border-b border-border last:border-0 flex-wrap">
            <div className="flex-1 min-w-[160px]">
              <p className="text-sm font-semibold text-foreground">{t.description}</p>
              <p className="text-xs text-muted-foreground">{dateBR(t.due_date + "T12:00")} · {t.category ?? (t.type === "receita" ? "Receita" : "Despesa")}</p>
            </div>
            <span className={`text-sm font-bold ${t.type === "receita" ? "text-primary" : "text-destructive"}`}>{t.type === "despesa" && "- "}{brl(t.amount)}</span>
            <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${t.status === "Pago" ? "bg-primary-light text-primary-dark" : "bg-accent/15 text-accent"}`}>{t.status}</span>
            {t.status !== "Pago" && <Button size="sm" variant="outline" onClick={() => markPaid.mutate(t.id)}><Check className="w-4 h-4 mr-1" /> Pago</Button>}
            {t.type === "receita" && t.status === "Pago" && <Button size="sm" variant="ghost" onClick={() => receipt(t)}><FileText className="w-4 h-4 mr-1" /> Recibo</Button>}
            <Button size="icon" variant="ghost" onClick={() => confirm("Excluir?") && remove.mutate(t.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
          </div>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Novo lançamento</DialogTitle></DialogHeader>
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
