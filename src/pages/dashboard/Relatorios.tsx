import { Users, Calendar, TrendingUp, MessageSquare } from "lucide-react";

const Stat = ({ icon: Icon, label, value, color }: any) => (
  <div className="bg-card border border-border rounded-2xl p-5 text-center">
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3 ${color}`}>
      <Icon className="w-6 h-6" />
    </div>
    <p className="text-xs text-muted-foreground font-medium">{label}</p>
    <p className="text-2xl font-bold text-foreground mt-1">{value}</p>
  </div>
);

export default function Relatorios() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Relatórios</h1>
        <p className="text-muted-foreground text-sm mt-1">Dashboards e análise de dados da clínica</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Stat icon={Users} label="Pacientes ativos" value="98" color="bg-primary-light text-primary-dark" />
        <Stat icon={Calendar} label="Lista de espera" value="12" color="bg-blue-50 text-blue-600" />
        <Stat icon={TrendingUp} label="Com alta" value="24" color="bg-green-50 text-green-600" />
        <Stat icon={Users} label="Desativados" value="7" color="bg-gray-100 text-gray-600" />
        <Stat icon={Users} label="Desistentes" value="3" color="bg-red-50 text-red-600" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-2xl p-6">
          <h3 className="font-bold text-foreground mb-4">Sessões por mês</h3>
          <div className="flex items-end gap-2 h-40">
            {[40,55,48,72,65,80].map((v, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full bg-primary rounded-t" style={{ height: `${v}%` }} />
                <span className="text-xs text-muted-foreground">{["Dez","Jan","Fev","Mar","Abr","Mai"][i]}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6">
          <h3 className="font-bold text-foreground mb-4">Distribuição por abordagem</h3>
          <div className="space-y-3">
            {[
              { l: "TCC", v: 45, c: "bg-primary" },
              { l: "Psicanálise", v: 25, c: "bg-blue-500" },
              { l: "Humanista", v: 18, c: "bg-orange-500" },
              { l: "Sistêmica", v: 12, c: "bg-purple-500" },
            ].map((a) => (
              <div key={a.l}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium text-foreground">{a.l}</span>
                  <span className="text-muted-foreground">{a.v}%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className={`h-full ${a.c} rounded-full`} style={{ width: `${a.v}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <MessageSquare className="w-5 h-5 text-primary" />
          <h3 className="font-bold text-foreground">Confirmações de sessões — Maio/2026</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-muted/30 rounded-lg">
            <p className="text-xs text-muted-foreground">Total respostas</p>
            <p className="text-2xl font-bold text-foreground mt-1">147</p>
          </div>
          <div className="text-center p-4 bg-muted/30 rounded-lg">
            <p className="text-xs text-muted-foreground">Via E-mail</p>
            <p className="text-2xl font-bold text-foreground mt-1">42</p>
          </div>
          <div className="text-center p-4 bg-muted/30 rounded-lg">
            <p className="text-xs text-muted-foreground">Via WhatsApp</p>
            <p className="text-2xl font-bold text-green-600 mt-1">89</p>
          </div>
          <div className="text-center p-4 bg-muted/30 rounded-lg">
            <p className="text-xs text-muted-foreground">Via App</p>
            <p className="text-2xl font-bold text-purple-600 mt-1">16</p>
          </div>
        </div>
      </div>
    </div>
  );
}
