import { useState } from "react";

const plans = [
  {
    name: "Free", desc: "Para quem está começando", monthly: "Grátis", yearly: "Grátis", free: true,
    features: ["Até 5 pacientes", "Agenda básica", "Prontuário simplificado", "1 sala virtual/mês"],
    disabled: ["Financeiro", "Relatórios", "App mobile"],
  },
  {
    name: "Essencial", desc: "Para consultório individual", monthly: "R$ 89", yearly: "R$ 69",
    features: ["Até 30 pacientes", "Agenda completa", "Prontuário eletrônico", "Sala virtual ilimitada", "Controle financeiro"],
    disabled: ["Relatórios avançados", "Multi-profissional"],
  },
  {
    name: "Profissional", desc: "O mais completo para autônomos", monthly: "R$ 149", yearly: "R$ 119",
    popular: true,
    features: ["Pacientes ilimitados", "Todas as funcionalidades", "Relatórios avançados", "App mobile", "PsicoBank", "Suporte prioritário"],
    disabled: [],
  },
  {
    name: "Clínica", desc: "Para clínicas multi-profissionais", monthly: "R$ 299", yearly: "R$ 239",
    features: ["Tudo do Profissional", "Multi-profissionais", "Split de pagamento", "Dashboard administrativo", "Gestão de salas", "Suporte dedicado"],
    disabled: [],
  },
];

const PricingSection = () => {
  const [annual, setAnnual] = useState(true);

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
          <label className={`text-[15px] font-semibold cursor-pointer ${!annual ? "text-foreground" : "text-muted-foreground"}`} onClick={() => setAnnual(false)}>Mensal</label>
          <button
            onClick={() => setAnnual(!annual)}
            className={`relative w-[52px] h-7 rounded-full transition-colors cursor-pointer border-none ${annual ? "bg-primary" : "bg-border"}`}
          >
            <span className={`absolute w-[22px] h-[22px] rounded-full bg-card shadow-sm top-[3px] transition-transform ${annual ? "translate-x-[27px]" : "translate-x-[3px]"}`} />
          </button>
          <label className={`text-[15px] font-semibold cursor-pointer ${annual ? "text-foreground" : "text-muted-foreground"}`} onClick={() => setAnnual(true)}>Anual</label>
          {annual && <span className="bg-red-50 text-destructive text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-red-200">-20% OFF</span>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {plans.map(p => (
            <div key={p.name} className={`bg-card rounded-xl p-7 border-[1.5px] relative hover:-translate-y-1 hover:shadow-brand-lg transition-all ${p.popular ? "border-primary border-2 shadow-[0_0_0_4px_hsl(175_100%_33%/0.1)]" : "border-border"}`}>
              {p.popular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-[11px] font-bold px-3.5 py-1 rounded-full whitespace-nowrap">
                  ⭐ Mais popular
                </div>
              )}
              <div className="text-base font-extrabold text-foreground mb-1.5">{p.name}</div>
              <div className="text-xs text-muted-foreground mb-5 leading-relaxed">{p.desc}</div>
              <div className="mb-6">
                <span className={`text-[38px] font-extrabold leading-none ${p.free ? "text-primary" : "text-foreground"}`}>
                  {annual ? p.yearly : p.monthly}
                </span>
                {!p.free && <div className="text-xs text-muted-foreground mt-1">/mês</div>}
              </div>
              <button className={`w-full py-3 rounded-[9px] font-bold text-sm mb-5 cursor-pointer transition-all font-sans ${p.popular ? "gradient-primary text-primary-foreground border-none hover:shadow-brand" : "bg-transparent border-[1.5px] border-border text-foreground hover:border-primary hover:text-primary"}`}>
                {p.free ? "Começar grátis" : "Começar 15 dias grátis"}
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
          ))}
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
