import { TrendingUp, TrendingDown, DollarSign, FileText, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

const Card = ({ icon: Icon, label, value, sub, color }: any) => (
  <div className="bg-card border border-border rounded-2xl p-5">
    <div className="flex items-center gap-3 mb-3">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <p className="text-sm font-semibold text-foreground">{label}</p>
    </div>
    <p className="text-2xl font-bold text-foreground">{value}</p>
    <p className="text-xs text-muted-foreground mt-1">{sub}</p>
  </div>
);

export default function Financeiro() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Financeiro</h1>
          <p className="text-muted-foreground text-sm mt-1">Painel financeiro - Maio/2026</p>
        </div>
        <Button variant="outline"><Download className="w-4 h-4 mr-2" /> Exportar</Button>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Card icon={DollarSign} label="Resultado previsto" value="R$ 12.480,00" sub="Resultado atual: R$ 8.200,00" color="bg-primary-light text-primary-dark" />
        <Card icon={TrendingUp} label="Receitas previstas" value="R$ 14.800,00" sub="Pago: R$ 9.200 · Pendente: R$ 5.600" color="bg-green-50 text-green-600" />
        <Card icon={TrendingDown} label="Despesas previstas" value="R$ 2.320,00" sub="Pago: R$ 1.000 · A pagar: R$ 1.320" color="bg-red-50 text-red-600" />
      </div>

      <div className="bg-card border border-border rounded-2xl p-6">
        <h2 className="font-bold text-foreground mb-5">Resultado mensal — 2026</h2>
        <div className="flex items-end gap-2 h-48">
          {["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"].map((m, i) => {
            const r = [70,85,60,90,75,40,30,20,15,10,5,5][i];
            const d = [20,25,18,30,22,10,8,5,5,5,2,2][i];
            return (
              <div key={m} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex gap-0.5 items-end h-40">
                  <div className="flex-1 bg-primary rounded-t" style={{ height: `${r}%` }} />
                  <div className="flex-1 bg-red-400 rounded-t" style={{ height: `${d}%` }} />
                </div>
                <span className="text-[10px] text-muted-foreground font-medium">{m}</span>
              </div>
            );
          })}
        </div>
        <div className="flex items-center gap-5 mt-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-primary" /> Receitas</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-red-400" /> Despesas</span>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-2xl p-6">
          <h3 className="font-bold text-foreground mb-4">Cobranças pendentes</h3>
          <div className="space-y-3">
            {[
              { n: "Ana Costa", v: "R$ 200,00", d: "3 dias" },
              { n: "João Pereira", v: "R$ 180,00", d: "5 dias" },
              { n: "Lucas Almeida", v: "R$ 220,00", d: "7 dias" },
            ].map((c, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                <div>
                  <p className="text-sm font-semibold">{c.n}</p>
                  <p className="text-xs text-muted-foreground">Atrasado {c.d}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-red-600">{c.v}</p>
                  <button className="text-xs text-primary font-semibold hover:underline">Cobrar</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6">
          <h3 className="font-bold text-foreground mb-4">Recibos recentes</h3>
          <div className="space-y-3">
            {[
              { n: "Maria Silva", v: "R$ 200,00", d: "Hoje" },
              { n: "Carlos Mendes", v: "R$ 180,00", d: "Ontem" },
              { n: "Beatriz Santos", v: "R$ 200,00", d: "2 dias" },
            ].map((c, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                <div className="flex items-center gap-3">
                  <FileText className="w-4 h-4 text-primary" />
                  <div>
                    <p className="text-sm font-semibold">{c.n}</p>
                    <p className="text-xs text-muted-foreground">{c.d}</p>
                  </div>
                </div>
                <p className="text-sm font-bold text-green-600">{c.v}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
