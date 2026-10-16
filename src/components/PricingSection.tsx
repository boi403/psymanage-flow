import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { PLANS, brl } from "@/lib/format";
import { Switch } from "@/components/ui/switch";

const PricingSection = () => {
  const [annual, setAnnual] = useState(true);
  const navigate = useNavigate();
  const { user } = useAuth();

  // Not logged in: go sign up/sign in first, carrying the chosen plan so
  // Auth.tsx can land the person straight on it afterward. Already logged in:
  // skip straight to the subscription picker with that plan pre-selected.
  const choosePlan = (planId: string) => {
    navigate(user ? `/dashboard/planos?plan=${encodeURIComponent(planId)}` : `/auth?plano=${encodeURIComponent(planId)}`);
  };

  return (
    <section id="planos" className="bg-muted py-20 px-[5%]">
      <div className="max-w-[1200px] mx-auto">
        <div className="mb-14 text-center">
          <div className="inline-flex items-center gap-1.5 text-primary text-[13px] font-bold uppercase tracking-wider mb-3">
            <span className="inline-block w-5 h-0.5 bg-primary rounded" />
            Planos
          </div>
          <h2 className="text-3xl md:text-[38px] font-extrabold text-foreground leading-tight mb-3.5">
            Escolha o plano <span className="text-primary">ideal para você</span>
          </h2>
        </div>

        <div className="flex items-center justify-center gap-3 mb-12">
          <label htmlFor="billing-cycle" className={`text-[15px] font-semibold cursor-pointer ${!annual ? "text-foreground" : "text-muted-foreground"}`}>Mensal</label>
          <Switch id="billing-cycle" checked={annual} onCheckedChange={setAnnual} aria-label={annual ? "Cobrança anual (clique para mensal)" : "Cobrança mensal (clique para anual)"} />
          <label htmlFor="billing-cycle" className={`text-[15px] font-semibold cursor-pointer ${annual ? "text-foreground" : "text-muted-foreground"}`}>Anual</label>
          {annual && <span className="bg-red-50 text-destructive text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-red-200">-20% OFF</span>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {PLANS.map(p => {
            const price = annual ? p.yearly : p.monthly;
            const free = price === 0;
            return (
              <div key={p.id} className={`bg-card rounded-xl p-7 border-[1.5px] relative hover:-translate-y-1 hover:shadow-brand-lg transition-all ${"popular" in p && p.popular ? "border-primary border-2 shadow-[0_0_0_4px_hsl(175_100%_33%/0.1)]" : "border-border"}`}>
                {"popular" in p && p.popular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-[11px] font-bold px-3.5 py-1 rounded-full whitespace-nowrap">
                    ⭐ Mais popular
                  </div>
                )}
                <div className="text-base font-extrabold text-foreground mb-1.5">{p.id}</div>
                <div className="text-xs text-muted-foreground mb-5 leading-relaxed">{p.desc}</div>
                <div className="mb-6">
                  <span className={`text-[38px] font-extrabold leading-none ${free ? "text-primary" : "text-foreground"}`}>
                    {free ? "Grátis" : brl(price)}
                  </span>
                  {!free && <div className="text-xs text-muted-foreground mt-1">/mês</div>}
                </div>
                <button
                  type="button"
                  onClick={() => choosePlan(p.id)}
                  className={`w-full py-3 rounded-[9px] font-bold text-sm mb-5 cursor-pointer transition-all font-sans ${"popular" in p && p.popular ? "gradient-primary text-primary-foreground border-none hover:shadow-brand" : "bg-transparent border-[1.5px] border-border text-foreground hover:border-primary hover:text-primary"}`}
                >
                  {free ? "Começar grátis" : "Começar 15 dias grátis"}
                </button>
                <ul className="space-y-1.5">
                  {p.features.map(f => (
                    <li key={f} className="flex items-center gap-2 text-[13px] text-muted-foreground py-1">
                      <span className="text-primary font-extrabold text-xs shrink-0">✓</span> {f}
                    </li>
                  ))}
                  {p.disabled.map(f => (
                    <li key={f} className="flex items-center gap-2 text-[13px] text-text-light py-1">
                      <span className="text-text-light text-xs shrink-0">✕</span> {f}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
