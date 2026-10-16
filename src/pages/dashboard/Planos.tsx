import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { brl, dateBR, PLANS } from "@/lib/format";

export default function Planos() {
  const qc = useQueryClient();
  const [params] = useSearchParams();
  const [cycle, setCycle] = useState<"mensal" | "anual">("anual");
  const preselect = params.get("plan");

  const { data: current } = useQuery({
    queryKey: ["my-subscription"],
    queryFn: async () => (await supabase.from("subscriptions").select("*").order("created_at", { ascending: false }).limit(1).maybeSingle()).data,
  });

  const choose = useMutation({
    mutationFn: async (planId: string) => {
      const p = PLANS.find((x) => x.id === planId)!;
      const price = cycle === "anual" ? p.yearly : p.monthly;
      if (current) await supabase.from("subscriptions").update({ status: "cancelada" }).eq("id", current.id);
      const { error } = await supabase.from("subscriptions").insert({ plan: planId, billing_cycle: cycle, price, status: price === 0 ? "ativa" : "trial" });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["my-subscription"] }); toast.success("Plano ativado! 15 dias grátis para testar."); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Meu plano</h1>
        {current ? (
          <p className="text-muted-foreground text-sm mt-1">
            Plano atual: <b className="text-foreground">{current.plan}</b> ({current.billing_cycle}) · {brl(current.price)}/mês · status <b>{current.status}</b>
            {current.status === "trial" && current.trial_ends_at && ` até ${dateBR(current.trial_ends_at)}`}
          </p>
        ) : <p className="text-muted-foreground text-sm mt-1">Você ainda não escolheu um plano.</p>}
      </div>
      <div className="flex gap-2">
        {(["mensal", "anual"] as const).map((c) => (
          <Button key={c} variant={cycle === c ? "default" : "outline"} onClick={() => setCycle(c)} className="capitalize">{c}{c === "anual" && " (-20%)"}</Button>
        ))}
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        {PLANS.map((p) => {
          const price = cycle === "anual" ? p.yearly : p.monthly;
          const isCurrent = current?.plan === p.id && current.status !== "cancelada";
          return (
            <div key={p.id} className={`bg-card rounded-2xl p-6 border-2 flex flex-col ${preselect === p.id || isCurrent ? "border-primary" : "border-border"}`}>
              <p className="font-extrabold text-foreground">{p.id}</p>
              <p className="text-xs text-muted-foreground mt-1">{p.desc}</p>
              <p className="text-3xl font-extrabold text-foreground mt-3">{price === 0 ? "Grátis" : brl(price)}</p>
              {price > 0 && <p className="text-xs text-muted-foreground">/mês</p>}
              <Button disabled={isCurrent || choose.isPending} onClick={() => choose.mutate(p.id)} className="w-full mt-5 gradient-primary text-primary-foreground">
                {isCurrent ? "Plano atual" : price === 0 ? "Usar grátis" : "Começar 15 dias grátis"}
              </Button>
              <ul className="space-y-1.5 mt-5">
                {p.features.map((f) => <li key={f} className="flex items-center gap-2 text-xs text-muted-foreground"><span className="text-primary font-extrabold shrink-0">✓</span>{f}</li>)}
                {p.disabled.map((f) => <li key={f} className="flex items-center gap-2 text-xs text-muted-foreground/60"><span className="shrink-0">✕</span>{f}</li>)}
              </ul>
            </div>
          );
        })}
      </div>
      <p className="text-xs text-muted-foreground">A cobrança automática no cartão será ativada em breve. Durante o período de teste, nenhum valor é cobrado.</p>
    </div>
  );
}
