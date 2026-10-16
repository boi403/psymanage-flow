import { Calendar, Users, Wallet, TrendingUp, CheckCircle2, AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { brl } from "@/lib/format";

const Kpi = ({ icon: Icon, label, value, color }: any) => (
  <div className="bg-card border border-border rounded-2xl p-5 hover:shadow-brand transition-all">
    <div className="flex items-start justify-between mb-3">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
    </div>
    <p className="text-xs text-muted-foreground font-medium">{label}</p>
    <p className="text-2xl font-bold text-foreground mt-1">{value}</p>
  </div>
);

export default function Painel() {
  const { user } = useAuth();
  const name = user?.user_metadata?.full_name?.split(" ")[0] ?? "Psicólogo(a)";

  const { data: profile } = useQuery({
    queryKey: ["painel-profile", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("profiles").select("crp, specialty").eq("id", user!.id).maybeSingle()).data,
  });
  const profileIncomplete = profile && (!profile.crp || !profile.specialty);

  const { data } = useQuery({
    queryKey: ["painel-overview"],
    queryFn: async () => {
      const [p, s, t] = await Promise.all([
        supabase.from("patients").select("status"),
        supabase.from("sessions").select("starts_at, status, patients(name)").order("starts_at"),
        supabase.from("transactions").select("amount, status, type, due_date"),
      ]);
      return { patients: p.data ?? [], sessions: s.data ?? [], tx: t.data ?? [] };
    },
  });
  const patients = data?.patients ?? [], sessions = data?.sessions ?? [], tx = data?.tx ?? [];

  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const monthStr = todayStr.slice(0, 7);

  const activePatients = patients.filter((p) => p.status === "Ativo").length;
  const sessionsToday = sessions.filter((s) => s.starts_at.slice(0, 10) === todayStr).length;
  const upcoming = sessions
    .filter((s) => s.status === "Agendada" && new Date(s.starts_at).getTime() >= now.getTime() - 3600_000)
    .slice(0, 4);
  const monthSessions = sessions.filter((s) => s.starts_at.slice(0, 7) === monthStr);
  const occupancy = monthSessions.length
    ? Math.round((monthSessions.filter((s) => s.status !== "Cancelada" && s.status !== "Falta").length / monthSessions.length) * 100)
    : 0;
  const revenueMonth = tx
    .filter((x) => x.type === "receita" && x.status === "Pago" && x.due_date?.slice(0, 7) === monthStr)
    .reduce((a, x) => a + Number(x.amount), 0);

  const statusLabel: Record<string, string> = { Agendada: "agendada", Realizada: "realizada", Cancelada: "cancelada", Falta: "falta" };
  const statusClass: Record<string, string> = {
    Agendada: "bg-orange-50 text-orange-700",
    Realizada: "bg-green-50 text-green-700",
    Cancelada: "bg-red-50 text-red-700",
    Falta: "bg-red-50 text-red-700",
  };

  const recentPayments = tx
    .filter((x) => x.type === "receita" && x.status === "Pago")
    .slice(-4)
    .reverse();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Olá, {name} 👋</h1>
        <p className="text-muted-foreground text-sm mt-1">Aqui está o resumo da sua clínica hoje.</p>
      </div>

      {profileIncomplete && (
        <Link to="/dashboard/configuracao" className="flex items-center gap-3 bg-accent/15 border border-accent text-accent-foreground rounded-xl p-4 text-sm hover:bg-accent/20 transition-colors">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span>Complete seu CRP e especialidade em Configurações — comum para quem entrou com o Google, já que ele não informa esses dados. Alguns recursos (como o Receita Saúde) dependem disso.</span>
        </Link>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi icon={Calendar} label="Sessões hoje" value={sessionsToday} color="bg-primary-light text-primary-dark" />
        <Kpi icon={Users} label="Pacientes ativos" value={activePatients} color="bg-blue-50 text-blue-600" />
        <Kpi icon={Wallet} label="Receita do mês" value={brl(revenueMonth)} color="bg-green-50 text-green-600" />
        <Kpi icon={TrendingUp} label="Taxa ocupação" value={`${occupancy}%`} color="bg-orange-50 text-orange-600" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-bold text-foreground">Próximas sessões</h2>
            <button className="text-xs text-primary font-semibold hover:underline">Ver agenda</button>
          </div>
          <div className="space-y-3">
            {upcoming.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma sessão agendada.</p>}
            {upcoming.map((it: any, i: number) => (
              <div key={i} className="flex items-center gap-4 p-3 rounded-xl hover:bg-muted/50 transition-colors">
                <div className="w-14 text-center">
                  <p className="text-sm font-bold text-foreground">{new Date(it.starts_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</p>
                </div>
                <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-primary-foreground text-xs font-bold">
                  {(it.patients?.name ?? "—").split(" ").map((p: string) => p[0]).join("").slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{it.patients?.name ?? "—"}</p>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${statusClass[it.status] ?? "bg-muted text-muted-foreground"}`}>
                  {statusLabel[it.status] ?? it.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6">
          <h2 className="font-bold text-foreground mb-5">Pagamentos recentes</h2>
          <div className="space-y-4">
            {recentPayments.length === 0 && <p className="text-sm text-muted-foreground">Nenhum pagamento registrado.</p>}
            {recentPayments.map((it: any, i: number) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-green-600 bg-green-50">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">Pagamento recebido</p>
                  <p className="text-xs text-muted-foreground">{brl(it.amount)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
