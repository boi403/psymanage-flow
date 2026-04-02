const AppSection = () => (
  <section className="py-20 px-[5%] overflow-hidden">
    <div className="max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
      <div>
        <div className="inline-flex items-center gap-1.5 text-primary text-[13px] font-bold uppercase tracking-wider mb-3">
          <span className="inline-block w-5 h-0.5 bg-primary rounded" />
          App Mobile
        </div>
        <h2 className="text-3xl md:text-[38px] font-extrabold text-foreground leading-tight mb-3.5">
          Seu consultório no <span className="text-primary">bolso</span>
        </h2>
        <p className="text-[17px] text-muted-foreground leading-relaxed max-w-[480px] mb-7">
          Gerencie sua agenda, confirme sessões e acompanhe seu financeiro de qualquer lugar com o app PsicoManager.
        </p>
        <div className="flex gap-3 flex-wrap">
          <a href="#" className="flex items-center gap-2.5 bg-foreground text-primary-foreground px-5 py-2.5 rounded-[10px] no-underline hover:bg-primary-dark hover:-translate-y-0.5 transition-all">
            <span className="text-lg">🍎</span>
            <div><span className="block text-[10px] opacity-70">Baixar na</span><strong className="text-sm">App Store</strong></div>
          </a>
          <a href="#" className="flex items-center gap-2.5 bg-foreground text-primary-foreground px-5 py-2.5 rounded-[10px] no-underline hover:bg-primary-dark hover:-translate-y-0.5 transition-all">
            <span className="text-lg">▶️</span>
            <div><span className="block text-[10px] opacity-70">Disponível no</span><strong className="text-sm">Google Play</strong></div>
          </a>
        </div>
      </div>

      {/* Phone mockup */}
      <div className="flex justify-center">
        <div className="w-[260px] bg-foreground rounded-[40px] p-3.5 shadow-[0_30px_80px_rgba(0,0,0,0.25)] border-2 border-foreground/30">
          <div className="bg-card rounded-[28px] overflow-hidden h-[480px]">
            <div className="bg-primary-dark px-4 py-2 flex justify-between items-center">
              <span className="text-primary-foreground text-[11px] font-bold">9:41</span>
              <span className="text-primary-foreground text-[10px]">📶 🔋</span>
            </div>
            <div className="p-3.5">
              <div className="text-[13px] font-extrabold text-foreground mb-3.5">
                Olá, <span className="text-primary">Dra. Marina</span> 👋
              </div>
              <div className="grid grid-cols-2 gap-2 mb-3.5">
                <div className="bg-muted rounded-[10px] p-2.5 border border-border">
                  <div className="text-lg font-extrabold text-primary-dark">8</div>
                  <div className="text-[9px] text-muted-foreground font-semibold">Sessões hoje</div>
                </div>
                <div className="bg-muted rounded-[10px] p-2.5 border border-border">
                  <div className="text-lg font-extrabold text-primary-dark">47</div>
                  <div className="text-[9px] text-muted-foreground font-semibold">Pacientes</div>
                </div>
              </div>
              <div className="bg-primary rounded-[10px] p-3 mb-2.5">
                <div className="text-primary-foreground text-[10px] font-bold opacity-80 mb-1">Próxima sessão</div>
                <div className="text-primary-foreground text-[13px] font-extrabold">Ana Clara Mendes</div>
                <div className="text-primary-foreground/80 text-[10px]">08:00 – 09:00 · Online</div>
              </div>
              <div className="space-y-1.5">
                {["Roberto S. · 09:30", "Fernanda L. · 11:00", "Marcos T. · 14:00"].map(s => (
                  <div key={s} className="bg-muted rounded-lg p-2 border border-border text-[11px] text-muted-foreground font-medium">{s}</div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
);

export default AppSection;
