import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { dateTimeBR } from "@/lib/format";

export default function SalaVirtual() {
  const { id } = useParams();
  const { data: s } = useQuery({
    queryKey: ["session", id],
    queryFn: async () => (await supabase.from("sessions").select("*, patients(name)").eq("id", id!).maybeSingle()).data,
  });
  if (!s) return <p className="text-muted-foreground">Carregando sala...</p>;
  const room = `PsicoManager-${s.room_code}`;
  const url = `https://meet.jit.si/${room}`;

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
        <Button variant="outline" onClick={() => { navigator.clipboard.writeText(url); toast.success("Link copiado — envie ao paciente"); }}>
          <Copy className="w-4 h-4 mr-2" /> Copiar link do paciente
        </Button>
      </div>
      <div className="rounded-2xl overflow-hidden border border-border bg-card" style={{ height: "75vh" }}>
        <iframe title="Sala virtual" src={url} allow="camera; microphone; fullscreen; display-capture; autoplay" className="w-full h-full border-0" />
      </div>
    </div>
  );
}
