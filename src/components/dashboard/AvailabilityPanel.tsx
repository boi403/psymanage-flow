import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link2, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { dateTimeBR } from "@/lib/format";

export function AvailabilityPanel() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [f, setF] = useState({ date: "", from: "08:00", to: "12:00", duration: "50", gap: "10", modality: "online" });

  const { data: slots = [] } = useQuery({
    queryKey: ["my-slots"],
    queryFn: async () => (await supabase.from("availability_slots").select("*").gte("starts_at", new Date().toISOString()).order("starts_at")).data ?? [],
  });

  const add = useMutation({
    mutationFn: async () => {
      const rows: { starts_at: string; duration_min: number; modality: string }[] = [];
      const dur = Number(f.duration), gap = Number(f.gap);
      let t = new Date(`${f.date}T${f.from}`);
      const end = new Date(`${f.date}T${f.to}`);
      while (t.getTime() + dur * 60000 <= end.getTime()) {
        rows.push({ starts_at: t.toISOString(), duration_min: dur, modality: f.modality });
        t = new Date(t.getTime() + (dur + gap) * 60000);
      }
      if (!rows.length) throw new Error("Intervalo não comporta nenhuma sessão");
      const { error } = await supabase.from("availability_slots").insert(rows);
      if (error) throw error;
      return rows.length;
    },
    onSuccess: (n) => { qc.invalidateQueries({ queryKey: ["my-slots"] }); toast.success(`${n} horários abertos`); },
    onError: (e: Error) => toast.error(e.message),
  });
  const del = useMutation({
    mutationFn: async (id: string) => { await supabase.from("availability_slots").delete().eq("id", id); },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["my-slots"] }),
  });

  const link = `${window.location.origin}/agendar/${user?.id}`;
  const open = slots.filter((s) => !s.booked);

  return (
    <div className="bg-card border border-border rounded-2xl">
      <div className="p-4 border-b border-border flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="font-bold text-foreground">Horários abertos para autoagendamento</h2>
          <p className="text-xs text-muted-foreground">Envie o link e o paciente escolhe o horário.</p>
        </div>
        <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(link); toast.success("Link copiado"); }}><Link2 className="w-4 h-4 mr-1" /> Copiar link de agendamento</Button>
      </div>
      <div className="p-4 grid grid-cols-2 md:grid-cols-6 gap-3 items-end border-b border-border">
        <div className="col-span-2"><Label>Dia</Label><Input type="date" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} /></div>
        <div><Label>Das</Label><Input type="time" value={f.from} onChange={(e) => setF({ ...f, from: e.target.value })} /></div>
        <div><Label>Até</Label><Input type="time" value={f.to} onChange={(e) => setF({ ...f, to: e.target.value })} /></div>
        <div><Label>Sessão / intervalo</Label>
          <div className="flex gap-1"><Input type="number" value={f.duration} onChange={(e) => setF({ ...f, duration: e.target.value })} /><Input type="number" value={f.gap} onChange={(e) => setF({ ...f, gap: e.target.value })} /></div>
        </div>
        <div><Label>Modalidade</Label>
          <Select value={f.modality} onValueChange={(v) => setF({ ...f, modality: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="online">Online</SelectItem><SelectItem value="presencial">Presencial</SelectItem></SelectContent>
          </Select>
        </div>
        <Button className="col-span-2 md:col-span-6 gradient-primary text-primary-foreground" disabled={!f.date || add.isPending} onClick={() => add.mutate()}><Plus className="w-4 h-4 mr-1" /> Abrir horários</Button>
      </div>
      <div className="p-4 flex flex-wrap gap-2">
        {!open.length && <p className="text-sm text-muted-foreground">Nenhum horário aberto.</p>}
        {open.map((s) => (
          <span key={s.id} className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-primary-light text-primary-dark font-semibold">
            {dateTimeBR(s.starts_at)}
            <button onClick={() => del.mutate(s.id)} aria-label="Remover"><Trash2 className="w-3 h-3" /></button>
          </span>
        ))}
      </div>
    </div>
  );
}
