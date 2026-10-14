import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CalendarCheck, Video, MapPin, Clock, CheckCircle2, ArrowLeft, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { dateTimeBR } from "@/lib/format";
import { bookingContactSchema } from "@/lib/booking";

const dayKey = (date: string) => new Date(date).toLocaleDateString("sv-SE");
const timeLabel = (date: string) => new Date(date).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

export default function Agendar() {
  const { userId } = useParams();
  const validId = !!userId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId);
  const qc = useQueryClient();
  const [day, setDay] = useState("");
  const [slot, setSlot] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", phone: "", email: "" });
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState<{ starts_at: string; duration_min: number; modality: string } | null>(null);

  const professional = useQuery({
    queryKey: ["pro", userId], enabled: validId,
    queryFn: async () => {
      if (!userId) throw new Error("Link inválido");
      const { data, error } = await supabase.rpc("public_professional", { _user_id: userId });
      if (error) throw error;
      return data?.[0] ?? null;
    },
  });
  const availability = useQuery({
    queryKey: ["open-slots", userId], enabled: validId,
    refetchInterval: done ? false : 30_000,
    queryFn: async () => {
      if (!userId) throw new Error("Link inválido");
      const { data, error } = await supabase.rpc("public_available_slots", { _user_id: userId });
      if (error) throw error;
      return data ?? [];
    },
  });
  const slots = availability.data ?? [];
  const days = [...new Set(slots.map((s) => dayKey(s.starts_at)))];
  const activeDay = days.includes(day) ? day : days[0];
  const selected = slots.find((s) => s.id === slot);
  const pro = professional.data;

  const book = useMutation({
    mutationFn: async () => {
      setError("");
      if (!selected) throw new Error("Escolha um horário disponível");
      const parsed = bookingContactSchema.safeParse(form);
      if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Verifique seus dados");
      const { data, error } = await supabase.rpc("book_slot", {
        _slot_id: selected.id, _name: parsed.data.name, _phone: parsed.data.phone, _email: parsed.data.email, _consent: consent,
      } as any);
      if (error) throw error;
      if (!data) throw new Error("Não foi possível confirmar a consulta. Tente novamente.");
      return { ...selected, starts_at: data };
    },
    onSuccess: (d) => { setDone(d); qc.invalidateQueries({ queryKey: ["open-slots", userId] }); },
    onError: (e: Error) => {
      setError(e.message);
      qc.invalidateQueries({ queryKey: ["open-slots", userId] });
    },
  });

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border px-6 py-5">
        <Link to="/" className="flex items-center gap-2 font-bold text-primary max-w-3xl mx-auto"><CalendarCheck className="h-6 w-6" />PsicoManager</Link>
      </header>
      <main className="max-w-3xl mx-auto px-5 py-10 space-y-8">
        <div className="space-y-2">
          <p className="text-sm font-semibold text-primary">Agendamento online</p>
          <h1 className="text-3xl font-bold break-words">{pro?.full_name || "Agende sua consulta"}</h1>
          {pro && <p className="text-muted-foreground">{[pro.specialty, pro.crp ? `CRP ${pro.crp}` : ""].filter(Boolean).join(" · ")}</p>}
        </div>
        {!validId || (!professional.isLoading && !professional.error && !pro) ? (
          <p role="alert" className="text-muted-foreground">Link de agendamento inválido. Solicite um novo link ao profissional.</p>
        ) : professional.error || availability.error ? (
          <div role="alert" className="space-y-3"><p className="text-destructive">Não foi possível carregar a agenda.</p><Button variant="outline" onClick={() => { professional.refetch(); availability.refetch(); }}>Tentar novamente</Button></div>
        ) : professional.isLoading || availability.isLoading ? (
          <p className="text-muted-foreground" role="status">Carregando horários…</p>
        ) : done ? (
          <section aria-live="polite" className="border-t border-border pt-8 space-y-5">
            <CheckCircle2 className="h-12 w-12 text-primary" />
            <h2 className="text-2xl font-bold">Consulta confirmada!</h2>
            <dl className="space-y-3">
              <div><dt className="text-sm text-muted-foreground">Profissional</dt><dd className="font-semibold">{pro?.full_name}</dd></div>
              <div><dt className="text-sm text-muted-foreground">Data e horário</dt><dd className="font-semibold">{dateTimeBR(done.starts_at)}</dd></div>
              <div><dt className="text-sm text-muted-foreground">Consulta</dt><dd>{done.modality === "online" ? "Online" : "Presencial"} · {done.duration_min} minutos</dd></div>
            </dl>
            <p className="text-sm text-muted-foreground">Horário local: {Intl.DateTimeFormat().resolvedOptions().timeZone}. Para alterações, entre em contato com o profissional.</p>
          </section>
        ) : !slots.length ? (
          <section className="border-t border-border py-8 space-y-3"><CalendarDays className="h-8 w-8 text-primary" /><h2 className="text-xl font-semibold">Nenhum horário disponível</h2><p className="text-muted-foreground">Entre em contato com o profissional para consultar novas datas.</p><Button variant="outline" onClick={() => availability.refetch()}>Atualizar horários</Button></section>
        ) : (
          <>
            <section className="space-y-4">
              <h2 className="text-lg font-bold flex items-center gap-2"><CalendarDays className="w-5 h-5 text-primary" />Escolha o dia</h2>
              <div className="flex flex-wrap gap-2">
                {days.map((d) => <Button key={d} variant={activeDay === d ? "default" : "outline"} aria-pressed={activeDay === d} disabled={book.isPending} className="h-auto min-w-24 flex-col py-3" onClick={() => { setDay(d); setSlot(null); setError(""); }}>
                  <span className="text-xs capitalize">{new Date(`${d}T12:00`).toLocaleDateString("pt-BR", { weekday: "short" })}</span>
                  <span className="text-base font-bold">{new Date(`${d}T12:00`).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}</span>
                </Button>)}
              </div>
            </section>
            <section className="space-y-4">
              <h2 className="text-lg font-bold flex items-center gap-2"><Clock className="w-5 h-5 text-primary" />Escolha o horário</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {slots.filter((s) => dayKey(s.starts_at) === activeDay).map((s) => <Button key={s.id} variant={slot === s.id ? "default" : "outline"} aria-pressed={slot === s.id} disabled={book.isPending} className="h-auto py-4 flex-col" onClick={() => { setSlot(s.id); setError(""); }}>
                  <span className="font-bold text-lg">{timeLabel(s.starts_at)}</span>
                  <span className="text-xs flex items-center gap-1">{s.modality === "online" ? <Video /> : <MapPin />}{s.modality === "online" ? "Online" : "Presencial"} · {s.duration_min} min</span>
                </Button>)}
              </div>
              <p className="text-xs text-muted-foreground">Horários em {Intl.DateTimeFormat().resolvedOptions().timeZone}</p>
            </section>
            {selected && <section className="border-t border-border pt-6 space-y-4">
              <h2 className="text-lg font-bold">Seus dados</h2>
              <p className="text-sm text-muted-foreground">{dateTimeBR(selected.starts_at)} · {selected.modality === "online" ? "Online" : "Presencial"}</p>
              <form className="space-y-4 max-w-lg" onSubmit={(e) => { e.preventDefault(); book.mutate(); }}>
                <div className="space-y-1.5"><Label htmlFor="patient-name">Nome completo *</Label><Input id="patient-name" autoComplete="name" required maxLength={120} disabled={book.isPending} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
                <div className="space-y-1.5"><Label htmlFor="patient-phone">WhatsApp com DDD *</Label><Input id="patient-phone" type="tel" autoComplete="tel" required maxLength={30} placeholder="(11) 99999-9999" disabled={book.isPending} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
                <div className="space-y-1.5"><Label htmlFor="patient-email">E-mail (opcional)</Label><Input id="patient-email" autoComplete="email" maxLength={160} type="email" disabled={book.isPending} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
                <label className="flex items-start gap-2 text-sm text-muted-foreground"><Checkbox checked={consent} onCheckedChange={(v) => setConsent(v === true)} disabled={book.isPending} /><span>Li e concordo com o tratamento dos meus dados pessoais para fins de agendamento, conforme a <Link to="/privacidade" className="underline hover:text-foreground" target="_blank">Política de Privacidade</Link>.</span></label>
                <Button type="submit" className="w-full" disabled={book.isPending || !consent}><CalendarCheck />{book.isPending ? "Confirmando…" : "Confirmar agendamento"}</Button>
              </form>
            </section>}
            {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
            {slot && !selected && <p role="alert" className="text-sm text-destructive">Este horário não está mais disponível. Escolha outro horário.</p>}
          </>
        )}
        <footer className="border-t border-border pt-5"><Link to="/" className="text-sm text-muted-foreground inline-flex items-center gap-2"><ArrowLeft className="w-4 h-4" />PsicoManager</Link></footer>
      </main>
    </div>
  );
}
