const HeroSection = () => {
  return (
    <section className="gradient-hero-bg relative overflow-hidden py-20 md:py-24 px-[5%]">
      <div className="absolute -top-24 -right-24 w-[600px] h-[600px] rounded-full bg-[radial-gradient(circle,hsl(175_100%_33%/0.08)_0%,transparent_70%)]" />

      <div className="max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        {/* Text */}
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 bg-primary-light text-primary-dark px-3.5 py-1.5 rounded-full text-[13px] font-semibold mb-5 border border-primary/20">
            <span className="text-accent">★</span> Nº 1 no Brasil para Psicólogos
          </div>

          <h1 className="text-4xl md:text-[48px] font-extrabold leading-[1.15] text-foreground mb-5">
            Gerencie seu consultório com <span className="text-primary">inteligência e praticidade</span>
          </h1>

          <p className="text-lg text-muted-foreground leading-relaxed mb-9 max-w-[480px]">
            Agenda online, prontuário eletrônico, sala virtual e controle financeiro em um único sistema. Mais de 20.000 psicólogos já simplificaram sua rotina.
          </p>

          <div className="flex items-center gap-3.5 flex-wrap">
            <a href="#" className="inline-flex px-8 py-4 gradient-primary text-primary-foreground rounded-[10px] font-bold text-base hover:-translate-y-0.5 transition-all shadow-[0_4px_20px_hsl(175_100%_33%/0.35)] hover:shadow-[0_8px_30px_hsl(175_100%_33%/0.4)] no-underline">
              Começar 15 dias grátis
            </a>
            <a href="#" className="inline-flex px-7 py-4 border-2 border-border text-foreground bg-background rounded-[10px] font-semibold text-base hover:border-primary hover:text-primary transition-all no-underline">
              Ver demonstração
            </a>
          </div>

          <div className="flex items-center gap-4 mt-7">
            <span className="text-amber-500 text-base tracking-wider">★★★★★</span>
            <p className="text-[13px] text-muted-foreground">
              <strong className="text-foreground">4.9/5</strong> · Avaliado por mais de 2.000 psicólogos
            </p>
          </div>
        </div>

        {/* Dashboard Mockup */}
        <div className="relative hidden lg:block">
          <div className="bg-card rounded-xl border border-border shadow-[0_20px_60px_rgba(0,0,0,0.12)] overflow-hidden">
            <div className="gradient-primary px-5 py-3.5 flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-primary-foreground/40" />
              <div className="w-2.5 h-2.5 rounded-full bg-primary-foreground/40" />
              <div className="w-2.5 h-2.5 rounded-full bg-primary-foreground/40" />
              <span className="text-primary-foreground text-[13px] font-semibold ml-1">PsicoManager – Painel</span>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-3 gap-2.5 mb-4">
                {[
                  { label: "Sessões hoje", value: "8", sub: "2 online" },
                  { label: "Pacientes ativos", value: "47", sub: "+3 este mês" },
                  { label: "Receita mensal", value: "R$9.400", sub: "↑ 12% vs mês ant." },
                ].map((s) => (
                  <div key={s.label} className="bg-muted rounded-[10px] p-3 border border-border">
                    <div className="text-[10px] text-muted-foreground font-medium mb-1">{s.label}</div>
                    <div className="text-lg font-extrabold text-primary-dark">{s.value}</div>
                    <div className="text-[9px] text-text-light">{s.sub}</div>
                  </div>
                ))}
              </div>

              <div className="bg-muted rounded-[10px] p-3.5 border border-border">
                <div className="text-[11px] font-bold text-foreground mb-2.5 flex justify-between">
                  Agenda de hoje – Ter, 02/04 <span className="text-primary text-[10px]">Ver tudo →</span>
                </div>
                {[
                  { time: "08h00", name: "Ana Clara M.", tag: "Online", color: "bg-primary", tagClass: "bg-primary-light text-primary-dark" },
                  { time: "09h30", name: "Roberto S.", tag: "Presencial", color: "bg-accent", tagClass: "bg-orange-50 text-orange-700" },
                  { time: "11h00", name: "Fernanda L.", tag: "Confirmado", color: "bg-emerald-500", tagClass: "bg-emerald-50 text-emerald-800" },
                  { time: "14h00", name: "Marcos T.", tag: "Online", color: "bg-primary", tagClass: "bg-primary-light text-primary-dark" },
                ].map((item) => (
                  <div key={item.time} className="flex items-center gap-2.5 py-2 border-b border-border last:border-b-0 text-[11px]">
                    <div className={`w-2 h-2 rounded-full ${item.color} shrink-0`} />
                    <span className="text-muted-foreground w-9 font-semibold">{item.time}</span>
                    <span className="font-semibold text-foreground flex-1">{item.name}</span>
                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-semibold ${item.tagClass}`}>{item.tag}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="absolute -top-5 -right-8 bg-card rounded-xl border border-border p-3 px-4 shadow-[0_8px_25px_rgba(0,0,0,0.10)] text-xs">
            <div className="text-[22px] mb-1">💳</div>
            <div className="font-bold text-foreground text-[13px]">PIX recebido</div>
            <div className="text-muted-foreground text-[11px]">R$ 200,00</div>
          </div>

          <div className="absolute -bottom-5 -left-8 bg-card rounded-xl border border-border p-3 px-4 shadow-[0_8px_25px_rgba(0,0,0,0.10)] text-xs">
            <div className="text-[22px] mb-1">🔔</div>
            <div className="font-bold text-foreground text-[13px]">Lembrete enviado</div>
            <div className="text-muted-foreground text-[11px]">Ana confirmou sessão</div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
