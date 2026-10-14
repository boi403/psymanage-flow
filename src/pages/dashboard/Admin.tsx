import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { brl, dateBR } from "@/lib/format";

const STATUS = ["trial", "ativa", "pendente", "cancelada"];

export default function Admin() {
  const { isAdmin, loading } = useIsAdmin();
  const qc = useQueryClient();
  const [q, setQ] = useState("");

  const { data } = useQuery({
    queryKey: ["admin-data"],
    enabled: isAdmin,
    queryFn: async () => {
      const [s, p] = await Promise.all([
        supabase.from("subscriptions").select("*").order("created_at", { ascending: false }),
        // F-03: never fetch other professionals' CPF here -- admin only needs
        // these fields to list/search accounts, not their tax identifiers.
        supabase.from("profiles").select("id, full_name, email, crp, phone, specialty, created_at").order("created_at", { ascending: false }),
      ]);
      return { subs: s.data ?? [], profiles: p.data ?? [] };
    },
  });
  const update = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => { await supabase.from("subscriptions").update({ status }).eq("id", id); },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-data"] }),
  });

  if (loading) return null;
  if (!isAdmin) return <Navigate to="/dashboard" replace />;

  const subs = data?.subs ?? [], profiles = data?.profiles ?? [];
  const prof = (id: string) => profiles.find((p) => p.id === id);
  const live = subs.filter((s) => s.status !== "cancelada");
  const mrr = live.filter((s) => s.status === "ativa").reduce((a, s) => a + Number(s.price), 0);
  const rows = subs.filter((s) => {
    const p = prof(s.user_id); const t = q.toLowerCase();
    return !t || (p?.full_name ?? "").toLowerCase().includes(t) || (p?.email ?? "").toLowerCase().includes(t) || s.plan.toLowerCase().includes(t);
  });

  const Stat = ({ l, v }: { l: string; v: string | number }) => (
    <div className="bg-card border border-border rounded-2xl p-4"><p className="text-xs text-muted-foreground">{l}</p><p className="text-2xl font-bold text-foreground mt-1">{v}</p></div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Administração</h1>
        <p className="text-muted-foreground text-sm mt-1">Todos os psicólogos cadastrados e seus planos.</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Stat l="Cadastrados" v={profiles.length} /><Stat l="Assinaturas ativas/teste" v={live.length} />
        <Stat l="Em teste" v={live.filter((s) => s.status === "trial").length} /><Stat l="Receita mensal (ativas)" v={brl(mrr)} />
      </div>

      <div className="bg-card border border-border rounded-2xl">
        <div className="p-4 border-b border-border"><Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nome, e-mail ou plano..." /></div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-xs uppercase text-muted-foreground border-b border-border">
              <th className="px-4 py-3">Psicólogo</th><th className="px-4 py-3">Plano</th><th className="px-4 py-3">Valor</th><th className="px-4 py-3">Início</th><th className="px-4 py-3">Status</th>
            </tr></thead>
            <tbody>
              {rows.length === 0 && <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">Nenhuma assinatura ainda.</td></tr>}
              {rows.map((s) => { const p = prof(s.user_id); return (
                <tr key={s.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3"><p className="font-semibold text-foreground">{p?.full_name ?? "—"}</p><p className="text-xs text-muted-foreground">{p?.email} {p?.crp && `· CRP ${p.crp}`} {p?.phone && `· ${p.phone}`}</p></td>
                  <td className="px-4 py-3 text-foreground">{s.plan} <span className="text-xs text-muted-foreground">({s.billing_cycle})</span></td>
                  <td className="px-4 py-3 text-foreground">{brl(s.price)}</td>
                  <td className="px-4 py-3 text-muted-foreground">{dateBR(s.started_at)}</td>
                  <td className="px-4 py-3">
                    <Select value={s.status} onValueChange={(status) => update.mutate({ id: s.id, status })}>
                      <SelectTrigger className="w-32 h-8"><SelectValue /></SelectTrigger>
                      <SelectContent>{STATUS.map((x) => <SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent>
                    </Select>
                  </td>
                </tr>); })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl">
        <h2 className="font-bold p-4 border-b border-border text-foreground">Todos os cadastrados</h2>
        {profiles.map((p) => (
          <div key={p.id} className="flex justify-between p-4 border-b border-border last:border-0 text-sm flex-wrap gap-2">
            <span className="font-semibold text-foreground">{p.full_name ?? "—"} <span className="font-normal text-muted-foreground">{p.email}</span></span>
            <span className="text-muted-foreground">{p.specialty} · desde {dateBR(p.created_at)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
