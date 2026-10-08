import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Video, MapPin, Trash2, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { brl, dateTimeBR } from "@/lib/format";
import { AvailabilityPanel } from "@/components/dashboard/AvailabilityPanel";
import { useAuth } from "@/hooks/useAuth";

const STATUS = ["Agendada", "Realizada", "Cancelada", "Falta"];

function waLink(s: any, proName: string) {
  let phone = (s.patients?.phone ?? "").replace(/\D/g, "");
  if (phone.length <= 11) phone = "55" + phone;
  const hora = new Date(s.starts_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  const msg = `Olá, ${s.patients?.name?.split(" ")[0] ?? ""}! Lembrete: daqui a 1 hora (às ${hora}) você tem consulta com ${proName}.${s.modality === "online" ? " A sessão será online." : ""}`;
  return `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
}

export default function Agenda() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ patient_id: "", starts_at: "", duration_min: "50", modality: "online", price: "" });

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id], enabled: !!user,
    queryFn: async () => (await supabase.from("profiles").select("full_name").eq("id", user!.id).maybeSingle()).data,
  });
  const proName = profile?.full_name ? `Dr(a). ${profile.full_name}` : "seu(sua) psicólogo(a)";

  const { data: patients = [] } = useQuery({
    queryKey: ["patients"],
    queryFn: async () => (await supabase.from("patients").select("*").order("name")).data ?? [],
  });
  const { data: sessions = [] } = useQuery({
    queryKey: ["sessions"],
    queryFn: async () => (await supabase.from("sessions").select("*, patients(name, phone)").order("starts_at")).data ?? [],
  });

  const create = useMutation({
    mutationFn: async () => {
      const p = patients.find((x) => x.id === form.patient_id);
      const { error } = await supabase.from("sessions").insert({
        patient_id: form.patient_id, starts_at: new Date(form.starts_at).toISOString(),
        duration_min: Number(form.duration_min), modality: form.modality,
        price: form.price ? Number(form.price) : Number(p?.session_price ?? 0),
      });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["sessions"] }); setOpen(false); toast.success("Sessão agendada"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const setStatus = useMutation({
    mutationFn: async ({ s, status }: { s: any; status: string }) => {
      const { error } = await supabase.from("sessions").update({ status }).eq("id", s.id);
      if (error) throw error;
      if (status === "Realizada") {
        const { data: exists } = await supabase.from("transactions").select("id").eq("session_id", s.id).maybeSingle();
        if (!exists) await supabase.from("transactions").insert({
          type: "receita", description: `Sessão — ${s.patients?.name ?? ""}`, amount: s.price,
          due_date: s.starts_at.slice(0, 10), status: "Pendente", patient_id: s.patient_id, session_id: s.id, category: "Sessão",
        });
      }
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["sessions"] }); qc.invalidateQueries({ queryKey: ["transactions"] });
      if (v.status === "Realizada") toast.success("Sessão realizada — cobrança lançada no financeiro");
    },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => { await supabase.from("sessions").delete().eq("id", id); },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sessions"] }),
  });

  const now = Date.now();
  const upcoming = sessions.filter((s) => new Date(s.starts_at).getTime() >= now - 3600_000);
  const past = sessions.filter((s) => new Date(s.starts_at).getTime() < now - 3600_000).reverse();

  const Row = ({ s }: { s: any }) => (
    <div className="flex items-center gap-4 p-4 border-b border-border last:border-0 flex-wrap">
      <div className="min-w-[130px]">
        <p className="text-sm font-bold text-foreground">{dateTimeBR(s.starts_at)}</p>
        <p className="text-xs text-muted-foreground">{s.duration_min} min · {brl(s.price)}</p>
      </div>
      <div className="flex-1 min-w-[140px]">
        <p className="font-semibold text-foreground">{s.patients?.name}</p>
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          {s.modality === "online" ? <><Video className="w-3 h-3" /> Online</> : <><MapPin className="w-3 h-3" /> Presencial</>}
        </p>
      </div>
      <Select value={s.status} onValueChange={(status) => setStatus.mutate({ s, status })}>
        <SelectTrigger className="w-36 h-9"><SelectValue /></SelectTrigger>
        <SelectContent>{STATUS.map((x) => <SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent>
      </Select>
      {s.status === "Agendada" && s.patients?.phone && (
        <Button asChild size="sm" variant="outline" title="Lembrete WhatsApp">
          <a target="_blank" rel="noreferrer" href={waLink(s, proName)}><MessageCircle className="w-4 h-4 mr-1" /> Lembrete</a>
        </Button>
      )}
      <Button asChild size="sm" className="gradient-primary text-primary-foreground">
        <Link to={`/dashboard/sala/${s.id}`}><Video className="w-4 h-4 mr-1" /> {s.modality === "online" ? "Entrar na sala" : "Gravar sessão"}</Link>
      </Button>
      <Button size="icon" variant="ghost" onClick={() => confirm("Excluir sessão?") && remove.mutate(s.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Agenda</h1>
          <p className="text-muted-foreground text-sm mt-1">Sessões, salas virtuais e confirmações.</p>
        </div>
        <Button onClick={() => setOpen(true)} disabled={!patients.length} className="gradient-primary text-primary-foreground"><Plus className="w-4 h-4 mr-2" /> Nova sessão</Button>
      </div>
      {!patients.length && <p className="text-sm text-muted-foreground">Cadastre um paciente primeiro para agendar sessões.</p>}

      <AvailabilityPanel />


      <div className="bg-card border border-border rounded-2xl">
        <h2 className="font-bold p-4 border-b border-border text-foreground">Próximas sessões ({upcoming.length})</h2>
        {upcoming.length ? upcoming.map((s) => <Row key={s.id} s={s} />) : <p className="p-6 text-sm text-muted-foreground">Nenhuma sessão agendada.</p>}
      </div>
      {past.length > 0 && (
        <div className="bg-card border border-border rounded-2xl">
          <h2 className="font-bold p-4 border-b border-border text-foreground">Histórico</h2>
          {past.map((s) => <Row key={s.id} s={s} />)}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nova sessão</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Paciente</Label>
              <Select value={form.patient_id} onValueChange={(v) => setForm({ ...form, patient_id: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{patients.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Data e hora</Label><Input type="datetime-local" value={form.starts_at} onChange={(e) => setForm({ ...form, starts_at: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Duração (min)</Label><Input type="number" value={form.duration_min} onChange={(e) => setForm({ ...form, duration_min: e.target.value })} /></div>
              <div><Label>Valor (vazio = padrão)</Label><Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /></div>
            </div>
            <div><Label>Modalidade</Label>
              <Select value={form.modality} onValueChange={(v) => setForm({ ...form, modality: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="online">Online (sala virtual)</SelectItem><SelectItem value="presencial">Presencial</SelectItem></SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter><Button disabled={!form.patient_id || !form.starts_at || create.isPending} onClick={() => create.mutate()} className="gradient-primary text-primary-foreground">Agendar</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
