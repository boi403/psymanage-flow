import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { brl } from "@/lib/format";
import { toast } from "sonner";

const todayBRT = () => new Date().toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });

export default function Relatorios() {
  const [from, setFrom] = useState(() => todayBRT().slice(0, 7) + "-01");
  const [to, setTo] = useState(todayBRT);

  const { data, error } = useQuery({
    queryKey: ["report", from, to],
    queryFn: async () => {
      const [p, s, t] = await Promise.all([
        supabase.from("patients").select("*"),
        supabase.from("sessions").select("*, patients(name)").gte("starts_at", from).lte("starts_at", to + "T23:59:59-03:00"),
        supabase.from("transactions").select("*").gte("due_date", from).lte("due_date", to),
      ]);
      if (p.error) throw p.error;
      if (s.error) throw s.error;
      if (t.error) throw t.error;
      return { patients: p.data ?? [], sessions: s.data ?? [], tx: t.data ?? [] };
    },
  });
  useEffect(() => { if (error) toast.error(error.message); }, [error]);
  const patients = data?.patients ?? [], sessions = data?.sessions ?? [], tx = data?.tx ?? [];
  const cnt = (st: string) => patients.filter((x) => x.status === st).length;
  const sCnt = (st: string) => sessions.filter((x) => x.status === st).length;
  const sum = (fn: (t: any) => boolean) => tx.filter(fn).reduce((a, t) => a + Number(t.amount), 0);
  const rec = sum((t) => t.type === "receita"), recPago = sum((t) => t.type === "receita" && t.status === "Pago");
  const desp = sum((t) => t.type === "despesa"), despPago = sum((t) => t.type === "despesa" && t.status === "Pago");
  const approaches = Object.entries(patients.reduce<Record<string, number>>((a, p) => { const k = p.approach || "Não informada"; a[k] = (a[k] || 0) + 1; return a; }, {}));
  const perPatient = Object.entries(sessions.filter((s) => s.status === "Realizada").reduce<Record<string, { n: number; v: number }>>((a, s: any) => {
    const k = s.patients?.name ?? "—"; a[k] = a[k] || { n: 0, v: 0 }; a[k].n++; a[k].v += Number(s.price); return a;
  }, {})).sort((a, b) => b[1].v - a[1].v);

  const Stat = ({ label, value }: { label: string; value: string | number }) => (
    <div className="bg-card border border-border rounded-2xl p-4 text-center">
      <p className="text-xs text-muted-foreground font-medium">{label}</p>
      <p className="text-2xl font-bold text-foreground mt-1">{value}</p>
    </div>
  );

  return (
    <div className="space-y-6 print:space-y-4">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Relatório final</h1>
          <p className="text-muted-foreground text-sm mt-1">Pacientes, atendimentos e financeiro do período.</p>
        </div>
        <div className="flex items-end gap-2 print:hidden">
          <div><Label className="text-xs">De</Label><Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></div>
          <div><Label className="text-xs">Até</Label><Input type="date" value={to} onChange={(e) => setTo(e.target.value)} /></div>
          <Button variant="outline" onClick={() => window.print()}><Printer className="w-4 h-4 mr-2" /> Imprimir / PDF</Button>
        </div>
      </div>

      <section>
        <h2 className="font-bold text-foreground mb-3">Pacientes</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <Stat label="Ativos" value={cnt("Ativo")} /><Stat label="Lista de espera" value={cnt("Lista de espera")} />
          <Stat label="Com alta" value={cnt("Alta")} /><Stat label="Inativos" value={cnt("Inativo")} /><Stat label="Desistentes" value={cnt("Desistente")} />
        </div>
      </section>

      <section>
        <h2 className="font-bold text-foreground mb-3">Atendimentos no período</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <Stat label="Total" value={sessions.length} /><Stat label="Realizadas" value={sCnt("Realizada")} />
          <Stat label="Agendadas" value={sCnt("Agendada")} /><Stat label="Canceladas" value={sCnt("Cancelada")} /><Stat label="Faltas" value={sCnt("Falta")} />
        </div>
      </section>

      <section>
        <h2 className="font-bold text-foreground mb-3">Financeiro no período</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Stat label="Receitas" value={brl(rec)} /><Stat label="Recebido" value={brl(recPago)} />
          <Stat label="Despesas" value={brl(desp)} /><Stat label="Resultado" value={brl(recPago - despPago)} />
        </div>
      </section>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-2xl p-6">
          <h3 className="font-bold text-foreground mb-4">Distribuição por abordagem</h3>
          {approaches.length === 0 && <p className="text-sm text-muted-foreground">Sem dados.</p>}
          <div className="space-y-3">
            {approaches.map(([l, v]) => {
              const pct = Math.round((v / patients.length) * 100);
              return (
                <div key={l}>
                  <div className="flex justify-between text-sm mb-1"><span className="font-medium text-foreground">{l}</span><span className="text-muted-foreground">{pct}%</span></div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden"><div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} /></div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="bg-card border border-border rounded-2xl p-6">
          <h3 className="font-bold text-foreground mb-4">Faturamento por paciente</h3>
          {perPatient.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma sessão realizada no período.</p>}
          <table className="w-full text-sm">
            <tbody>
              {perPatient.map(([n, v]) => (
                <tr key={n} className="border-b border-border last:border-0">
                  <td className="py-2 text-foreground">{n}</td><td className="py-2 text-muted-foreground">{v.n} sessões</td><td className="py-2 text-right font-semibold text-foreground">{brl(v.v)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
