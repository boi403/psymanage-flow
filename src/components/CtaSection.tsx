const CtaSection = () => (
  <section className="gradient-cta py-20 px-[5%] text-center">
    <h2 className="text-3xl md:text-[40px] font-extrabold text-primary-foreground leading-tight mb-4">
      Pronto para transformar seu consultório?
    </h2>
    <p className="text-primary-foreground/80 text-lg max-w-[540px] mx-auto mb-9 leading-relaxed">
      Junte-se a mais de 20.000 psicólogos que já simplificaram sua rotina com o PsicoManager.
    </p>
    <div className="flex justify-center gap-4 flex-wrap">
      <button className="px-9 py-4 bg-card text-primary-dark border-none rounded-[10px] font-extrabold text-base cursor-pointer transition-all hover:-translate-y-0.5 shadow-[0_4px_20px_rgba(0,0,0,0.15)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.2)] font-sans">
        Começar 15 dias grátis
      </button>
      <button className="px-9 py-4 border-2 border-primary-foreground/50 text-primary-foreground bg-transparent rounded-[10px] font-semibold text-base cursor-pointer transition-all hover:border-primary-foreground hover:bg-primary-foreground/10 font-sans">
        Falar com consultor
      </button>
    </div>
    <p className="text-primary-foreground/60 text-[13px] mt-5">Sem cartão de crédito · Cancele quando quiser</p>
  </section>
);

export default CtaSection;
