import { Calendar, Users, Wallet, TrendingUp, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const Kpi = ({ icon: Icon, label, value, delta, color }: any) => (
  <div className="bg-card border border-border rounded-2xl p-5 hover:shadow-brand transition-all">
    <div className="flex items-start justify-between mb-3">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <span className="text-xs font-semibold text-primary bg-primary-light px-2 py-1 rounded-md">{delta}</span>
    </div>
    <p className="text-xs text-muted-foreground font-medium">{label}</p>
    <p className="text-2xl font-bold text-foreground mt-1">{value}</p>
  </div>
);

export default function Painel() {
  const { user } = useAuth();
  const name = user?.user_metadata?.full_name?.split(" ")[0] ?? "Psicólogo(a)";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Olá, {name} 👋</h1>
        <p className="text-muted-foreground text-sm mt-1">Aqui está o resumo da sua clínica hoje.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi icon={Calendar} label="Sessões hoje" value="8" delta="+2" color="bg-primary-light text-primary-dark" />
        <Kpi icon={Users} label="Pacientes ativos" value="42" delta="+5" color="bg-blue-50 text-blue-600" />
        <Kpi icon={Wallet} label="Receita do mês" value="R$ 12.480" delta="+18%" color="bg-green-50 text-green-600" />
        <Kpi icon={TrendingUp} label="Taxa ocupação" value="87%" delta="+4%" color="bg-orange-50 text-orange-600" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-bold text-foreground">Próximas sessões</h2>
            <button className="text-xs text-primary font-semibold hover:underline">Ver agenda</button>
          </div>
          <div className="space-y-3">
            {[
              { h: "09:00", n: "Maria Silva", t: "Terapia individual", s: "confirmada" },
              { h: "10:30", n: "João Pereira", t: "Avaliação inicial", s: "pendente" },
              { h: "14:00", n: "Ana Costa", t: "Terapia de casal", s: "confirmada" },
              { h: "16:00", n: "Carlos Mendes", t: "Acompanhamento", s: "confirmada" },
            ].map((it, i) => (
              <div key={i} className="flex items-center gap-4 p-3 rounded-xl hover:bg-muted/50 transition-colors">
                <div className="w-14 text-center">
                  <p className="text-sm font-bold text-foreground">{it.h}</p>
                </div>
                <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-primary-foreground text-xs font-bold">
                  {it.n.split(" ").map(p => p[0]).join("").slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{it.n}</p>
                  <p className="text-xs text-muted-foreground">{it.t}</p>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${it.s === "confirmada" ? "bg-green-50 text-green-700" : "bg-orange-50 text-orange-700"}`}>
                  {it.s}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6">
          <h2 className="font-bold text-foreground mb-5">Atividade recente</h2>
          <div className="space-y-4">
            {[
              { i: CheckCircle2, c: "text-green-600 bg-green-50", t: "Pagamento recebido", d: "R$ 200 · Maria Silva" },
              { i: Clock, c: "text-orange-600 bg-orange-50", t: "Sessão reagendada", d: "João Pereira · amanhã 15h" },
              { i: AlertCircle, c: "text-red-600 bg-red-50", t: "Pagamento pendente", d: "Ana Costa · 3 dias" },
              { i: Users, c: "text-blue-600 bg-blue-50", t: "Novo paciente", d: "Lucas Almeida" },
            ].map((it, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${it.c}`}>
                  <it.i className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">{it.t}</p>
                  <p className="text-xs text-muted-foreground">{it.d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
