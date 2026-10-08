import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CalendarCheck, Video, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { dateTimeBR } from "@/lib/format";

export default function Agendar() {
  const { userId } = useParams();
  const qc = useQueryClient();
  const [slot, setSlot] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", phone: "", email: "" });
  const [done, setDone] = useState<string | null>(null);

  const { data: pro } = useQuery({
    queryKey: ["pro", userId],
    queryFn: async () => (await supabase.rpc("public_professional", { _user_id: userId! })).data?.[0] ?? null,
  });
  const { data: slots = [], isLoading } = useQuery({
    queryKey: ["open-slots", userId],
    queryFn: async () =>
      (await supabase.from("availability_slots").select("*").eq("user_id", userId!).eq("booked", false).gt("starts_at", new Date().toISOString()).order("starts_at")).data ?? [],
  });

  const book = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc("book_slot", { _slot_id: slot!, _name: form.name.trim(), _phone: form.phone.trim(), _email: form.email.trim() });
      if (error) throw error;
      return data as string;
    },
    onSuccess: (d) => { setDone(d); qc.invalidateQueries({ queryKey: ["open-slots", userId] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="min-h-screen bg-muted/30 py-10 px-4">
      <div className="max-w-xl mx-auto bg-card border border-border rounded-2xl p-6 space-y-5">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto rounded-xl gradient-primary flex items-center justify-center text-primary-foreground"><CalendarCheck className="w-6 h-6" /></div>
          <h1 className="text-xl font-bold mt-3 text-foreground">Agende sua consulta</h1>
          {pro && <p className="text-sm text-muted-foreground">{pro.full_name}{pro.crp ? ` · CRP ${pro.crp}` : ""}{pro.specialty ? ` · ${pro.specialty}` : ""}</p>}
        </div>

        {done ? (
          <div className="text-center p-6 rounded-xl bg-primary-light">
            <p className="font-bold text-primary-dark">Consulta agendada!</p>
            <p className="text-sm text-foreground mt-1">{dateTimeBR(done)}</p>
          </div>
        ) : (
          <>
            <div>
              <Label>Escolha um horário</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {isLoading && <p className="text-sm text-muted-foreground">Carregando...</p>}
                {!isLoading && !slots.length && <p className="text-sm text-muted-foreground col-span-2">Nenhum horário disponível no momento.</p>}
                {slots.map((s) => (
                  <button key={s.id} onClick={() => setSlot(s.id)}
                    className={`p-3 rounded-lg border text-left text-sm transition-colors ${slot === s.id ? "border-primary bg-primary-light" : "border-border hover:border-primary"}`}>
                    <p className="font-semibold text-foreground">{dateTimeBR(s.starts_at)}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">{s.modality === "online" ? <Video className="w-3 h-3" /> : <MapPin className="w-3 h-3" />}{s.modality} · {s.duration_min} min</p>
                  </button>
                ))}
              </div>
            </div>
            {slot && (
              <div className="space-y-3">
                <div><Label>Nome completo *</Label><Input maxLength={120} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
                <div><Label>WhatsApp *</Label><Input maxLength={30} placeholder="(11) 99999-9999" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
                <div><Label>E-mail</Label><Input maxLength={160} type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
                <Button className="w-full gradient-primary text-primary-foreground" disabled={!form.name.trim() || !form.phone.trim() || book.isPending} onClick={() => book.mutate()}>Confirmar agendamento</Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
