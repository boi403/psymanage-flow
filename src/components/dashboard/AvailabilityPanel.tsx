import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link2, Plus, Trash2, ExternalLink, Video, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { dateTimeBR } from "@/lib/format";
import { buildAvailability } from "@/lib/booking";

export function AvailabilityPanel() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [f, setF] = useState({ date: "", from: "08:00", to: "12:00", duration: "50", gap: "10", modality: "online" });
  const { data: slots = [], isLoading, error, refetch } = useQuery({
    queryKey: ["my-slots", user?.id], enabled: !!user, refetchInterval: 30_000,
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase.from("availability_slots").select("*").eq("user_id", user.id).gte("starts_at", new Date().toISOString()).order("starts_at");
      if (error) throw error;
      return data ?? [];
    },
  });
  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["my-slots"] });
    qc.invalidateQueries({ queryKey: ["open-slots"] });
  };
  const add = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Entre na sua conta para abrir horários");
      const rows = buildAvailability(f).map((s) => ({ ...s, user_id: user.id }));
      const { error } = await supabase.from("availability_slots").insert(rows);
      if (error) throw error;
      return rows.length;
    },
    onSuccess: (n) => { refresh(); toast.success(`${n} horários abertos`); },
    onError: (e: Error) => toast.error(e.message),
  });
  const del = useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error("Entre na sua conta");
      const { data, error } = await supabase.from("availability_slots").delete().eq("id", id).eq("user_id", user.id).eq("booked", false).select("id");
      if (error) throw error;
      if (!data?.length) throw new Error("Este horário já foi reservado ou removido");
    },
    onSuccess: () => { refresh(); toast.success("Horário removido"); },
    onError: (e: Error) => { refresh(); toast.error(e.message); },
  });
  const link = user ? `${window.location.origin}/agendar/${user.id}` : "";
  const open = slots.filter((s) => !s.booked);
  const today = new Date().toLocaleDateString("sv-SE");

  return (
    <section className="border-y border-border py-5 space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="font-bold text-foreground">Agendamento online</h2>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" disabled={!link} onClick={async () => {
            try { await navigator.clipboard.writeText(link); toast.success("Link copiado"); }
            catch { toast.error("Não foi possível copiar o link"); }
          }}><Link2 />Copiar link</Button>
          {link && <Button size="sm" variant="outline" asChild><a href={link} target="_blank" rel="noreferrer"><ExternalLink />Ver agenda pública</a></Button>}
        </div>
      </div>
      <form onSubmit={(e) => { e.preventDefault(); add.mutate(); }} className="grid grid-cols-2 md:grid-cols-6 gap-3 items-end">
        <div className="col-span-2 space-y-1"><Label htmlFor="availability-date">Dia</Label><Input id="availability-date" required min={today} type="date" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} /></div>
        <div className="space-y-1"><Label htmlFor="availability-from">Das</Label><Input id="availability-from" required type="time" value={f.from} onChange={(e) => setF({ ...f, from: e.target.value })} /></div>
        <div className="space-y-1"><Label htmlFor="availability-to">Até</Label><Input id="availability-to" required type="time" value={f.to} onChange={(e) => setF({ ...f, to: e.target.value })} /></div>
        <div className="space-y-1"><Label htmlFor="availability-duration">Duração (min)</Label><Input id="availability-duration" required type="number" min="1" max="480" value={f.duration} onChange={(e) => setF({ ...f, duration: e.target.value })} /></div>
        <div className="space-y-1"><Label htmlFor="availability-gap">Intervalo (min)</Label><Input id="availability-gap" required type="number" min="0" max="480" value={f.gap} onChange={(e) => setF({ ...f, gap: e.target.value })} /></div>
        <div className="col-span-2 space-y-1"><Label>Modalidade</Label><Select value={f.modality} onValueChange={(v) => setF({ ...f, modality: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="online">Online</SelectItem><SelectItem value="presencial">Presencial</SelectItem></SelectContent></Select></div>
        <Button type="submit" className="col-span-2 md:col-span-4" disabled={!f.date || add.isPending}><Plus />{add.isPending ? "Abrindo horários…" : "Abrir horários"}</Button>
      </form>
      <div className="space-y-3">
        <h3 className="text-sm font-semibold">Horários disponíveis ({open.length})</h3>
        {isLoading ? <p className="text-sm text-muted-foreground">Carregando…</p> : error ? <div role="alert"><p className="text-sm text-destructive">Não foi possível carregar os horários.</p><Button variant="link" onClick={() => refetch()}>Tentar novamente</Button></div> : !open.length ? <p className="text-sm text-muted-foreground">Nenhum horário aberto.</p> : (
          <ul className="grid sm:grid-cols-2 xl:grid-cols-3 gap-2">
            {open.map((s) => <li key={s.id} className="flex items-center justify-between gap-2 border border-border rounded-md p-3">
              <div><p className="text-sm font-semibold">{dateTimeBR(s.starts_at)}</p><p className="text-xs text-muted-foreground flex items-center gap-1">{s.modality === "online" ? <Video className="h-3 w-3" /> : <MapPin className="h-3 w-3" />}{s.modality === "online" ? "Online" : "Presencial"} · {s.duration_min} min</p></div>
              <Button size="icon" variant="ghost" title="Remover horário" aria-label={`Remover horário ${dateTimeBR(s.starts_at)}`} disabled={del.isPending} onClick={() => del.mutate(s.id)}><Trash2 className="text-destructive" /></Button>
            </li>)}
          </ul>
        )}
        {!!slots.filter((s) => s.booked).length && <p className="text-xs text-muted-foreground">{slots.filter((s) => s.booked).length} horário(s) reservado(s) por pacientes.</p>}
      </div>
    </section>
  );
}
