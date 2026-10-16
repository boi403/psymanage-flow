import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Copy, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { dateTimeBR } from "@/lib/format";
import SessionRecordings from "@/components/dashboard/SessionRecordings";

export default function SalaVirtual() {
  const { id } = useParams();
  const { data: s, isLoading, error } = useQuery({
    queryKey: ["session", id],
    enabled: !!id,
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase.from("sessions").select("*, patients(name)").eq("id", id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });
  if (isLoading) return <p className="text-muted-foreground">Carregando sala...</p>;
  if (error) return <p className="text-destructive">Erro ao carregar a sala. Tente novamente.</p>;
  if (!s) return <p className="text-muted-foreground">Sessão não encontrada.</p>;
  const room = `PsicoManager-${s.room_code}`;
  const jitsiUrl = `https://meet.jit.si/${room}`;
  const meetUrl: string | undefined = (s as any).meet_url || undefined;
  const url = meetUrl || jitsiUrl;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="icon"><Link to="/dashboard/agenda"><ArrowLeft className="w-4 h-4" /></Link></Button>
          <div>
            <h1 className="text-xl font-bold text-foreground">Sala virtual — {(s as any).patients?.name}</h1>
            <p className="text-xs text-muted-foreground">{dateTimeBR(s.starts_at)} · {s.duration_min} min</p>
          </div>
        </div>
        <Button variant="outline" onClick={async () => {
          try {
            await navigator.clipboard.writeText(url);
            toast.success("Link copiado — envie ao paciente");
          } catch {
            toast.error("Não foi possível copiar o link");
          }
        }}>
          <Copy className="w-4 h-4 mr-2" /> Copiar link do paciente
        </Button>
      </div>
      {meetUrl ? (
        <div className="rounded-2xl border border-border bg-card p-8 flex flex-col items-center justify-center gap-4 text-center" style={{ minHeight: "50vh" }}>
          <Video className="w-10 h-10 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">Esta consulta usa o Google Meet</h2>
          <p className="text-sm text-muted-foreground max-w-md">O Google Meet não pode ser incorporado nesta página. Clique no botão abaixo para entrar na chamada em uma nova aba.</p>
          <Button size="lg" asChild>
            <a href={meetUrl} target="_blank" rel="noopener noreferrer">
              <Video className="w-4 h-4 mr-2" /> Entrar no Google Meet
            </a>
          </Button>
        </div>
      ) : (
        <div className="rounded-2xl overflow-hidden border border-border bg-card" style={{ height: "75vh" }}>
          <iframe title="Sala virtual" src={jitsiUrl} allow="camera; microphone; fullscreen; display-capture; autoplay" className="w-full h-full border-0" />
        </div>
      )}
      <SessionRecordings sessionId={s.id} sessionDate={s.starts_at} />
    </div>
  );
}
