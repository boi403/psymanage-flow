import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, Plus, Phone, Mail, Pencil, Trash2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { brl } from "@/lib/format";
import type { Tables } from "@/integrations/supabase/types";

import { PatientChart } from "@/components/dashboard/PatientChart";
import { Checkbox } from "@/components/ui/checkbox";
import { isValidCPF } from "@/lib/receita";

type Patient = Tables<"patients">;
const STATUSES = ["Ativo", "Pausa", "Alta", "Inativo"];
const empty = { name: "", email: "", phone: "", cpf: "", birth_date: "", approach: "", status: "Ativo", session_price: "0", notes: "", modality: "Online", billing_mode: "por sessão", due_day: "10", payer_cpf: "", receipt_opt_in: true };

export default function Clientes() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Patient | null>(null);
  const [form, setForm] = useState(empty);
  const [recordPatient, setRecordPatient] = useState<Patient | null>(null);

  const { data: patients = [], isLoading } = useQuery({
    queryKey: ["patients"],
    queryFn: async () => {
      const { data, error } = await supabase.from("patients").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });

  const save = useMutation({
    mutationFn: async () => {
      if (form.cpf && !isValidCPF(form.cpf)) throw new Error("CPF do beneficiário inválido");
      if (form.payer_cpf && !isValidCPF(form.payer_cpf)) throw new Error("CPF do pagador inválido");
      const payload = { ...form, due_day: Number(form.due_day), session_price: Number(form.session_price || 0), birth_date: form.birth_date || null };
      const { error } = editing
        ? await supabase.from("patients").update(payload).eq("id", editing.id)
        : await supabase.from("patients").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["patients"] }); setOpen(false); toast.success("Paciente salvo"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("patients").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["patients"] }); toast.success("Paciente removido"); },
  });

  const openNew = () => { setEditing(null); setForm(empty); setOpen(true); };
  const openEdit = (p: Patient) => {
    setEditing(p);
    setForm({ name: p.name, email: p.email ?? "", phone: p.phone ?? "", cpf: p.cpf ?? "", birth_date: p.birth_date ?? "", approach: p.approach ?? "", status: p.status, session_price: String(p.session_price), notes: p.notes ?? "", modality: p.modality, billing_mode: p.billing_mode, due_day: String(p.due_day), payer_cpf: p.payer_cpf ?? "", receipt_opt_in: p.receipt_opt_in });
    setOpen(true);
  };

  const filtered = patients.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()) || (p.email ?? "").toLowerCase().includes(search.toLowerCase()));
  const count = (s: string) => patients.filter((p) => p.status === s).length;
  const f = (k: Exclude<keyof typeof empty, "receipt_opt_in">) => ({ value: form[k], onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm({ ...form, [k]: e.target.value }) });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Pacientes</h1>
          <p className="text-muted-foreground text-sm mt-1">Gerencie seus pacientes e prontuários.</p>
        </div>
        <Button onClick={openNew} className="gradient-primary text-primary-foreground"><Plus className="w-4 h-4 mr-2" /> Novo paciente</Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[{ l: "Total", v: patients.length }, { l: "Ativos", v: count("Ativo") }, { l: "Em pausa", v: count("Pausa") }, { l: "Alta", v: count("Alta") }].map((k) => (
          <div key={k.l} className="bg-card border border-border rounded-2xl p-4">
            <p className="text-xs text-muted-foreground font-medium">{k.l}</p>
            <p className="text-2xl font-bold mt-1 text-foreground">{k.v}</p>
          </div>
        ))}
      </div>

      <div className="bg-card border border-border rounded-2xl">
        <div className="p-4 border-b border-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar paciente..." className="pl-9" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground border-b border-border">
                <th className="font-semibold px-4 py-3">Paciente</th>
                <th className="font-semibold px-4 py-3 hidden md:table-cell">Contato</th>
                <th className="font-semibold px-4 py-3 hidden lg:table-cell">Abordagem</th>
                <th className="font-semibold px-4 py-3 hidden lg:table-cell">Valor sessão</th>
                <th className="font-semibold px-4 py-3">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {isLoading && <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">Carregando...</td></tr>}
              {!isLoading && filtered.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">Nenhum paciente ainda. Clique em "Novo paciente".</td></tr>}
              {filtered.map((c) => (
                <tr key={c.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full gradient-primary flex items-center justify-center text-primary-foreground text-xs font-bold">
                        {c.name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase()}
                      </div>
                      <span className="font-semibold text-foreground">{c.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">
                    <div className="flex flex-col gap-0.5 text-xs">
                      {c.email && <span className="flex items-center gap-1.5"><Mail className="w-3 h-3" /> {c.email}</span>}
                      {c.phone && <span className="flex items-center gap-1.5"><Phone className="w-3 h-3" /> {c.phone}</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell text-muted-foreground">{c.approach}</td>
                  <td className="px-4 py-3 hidden lg:table-cell text-muted-foreground">{brl(c.session_price)}</td>
                  <td className="px-4 py-3"><span className="text-xs px-2.5 py-1 rounded-full font-semibold bg-primary-light text-primary-dark">{c.status}</span></td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 justify-end">
                      <Button size="icon" variant="ghost" title="Prontuário" onClick={() => setRecordPatient(c)}><FileText className="w-4 h-4" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => openEdit(c)}><Pencil className="w-4 h-4" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => confirm("Remover paciente?") && remove.mutate(c.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? "Editar paciente" : "Novo paciente"}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2"><Label>Nome *</Label><Input {...f("name")} /></div>
            <div><Label>E-mail</Label><Input {...f("email")} /></div>
            <div><Label>Telefone</Label><Input {...f("phone")} /></div>
            <div><Label>CPF do beneficiário</Label><Input {...f("cpf")} /></div>
            <div><Label>Nascimento</Label><Input type="date" {...f("birth_date")} /></div>
            <div><Label>Abordagem</Label><Input {...f("approach")} placeholder="TCC, Psicanálise..." /></div>
            <div><Label>Valor da sessão (R$)</Label><Input type="number" {...f("session_price")} /></div>
            <div className="col-span-2"><Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>CPF do pagador</Label><Input {...f("payer_cpf")} /></div>
            <div><Label>Dia de vencimento</Label><Input type="number" min={1} max={31} {...f("due_day")} /></div>
            {[{k:"modality" as const,l:"Modalidade",o:["Online","Presencial","Híbrido"]},{k:"billing_mode" as const,l:"Forma de cobrança",o:["por sessão","mensal","pacote"]}].map(x=><div key={x.k}><Label>{x.l}</Label><Select value={form[x.k]} onValueChange={v=>setForm({...form,[x.k]:v})}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{x.o.map(v=><SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent></Select></div>)}
            <label className="col-span-2 flex items-center gap-2 text-sm"><Checkbox checked={form.receipt_opt_in} onCheckedChange={v=>setForm({...form,receipt_opt_in:v===true})}/> Opt-in de recibo Receita Saúde</label>
            <div className="col-span-2"><Label>Observações</Label><Textarea {...f("notes")} /></div>
          </div>
          <DialogFooter>
            <Button disabled={!form.name || save.isPending} onClick={() => save.mutate()} className="gradient-primary text-primary-foreground">Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {recordPatient && <PatientChart key={recordPatient.id} patient={recordPatient} onClose={() => setRecordPatient(null)} onEdit={() => { openEdit(recordPatient); setRecordPatient(null); }} />}
    </div>
  );
}
