const columns = [
  { title: "Produto", links: ["Funcionalidades", "Planos", "App Mobile", "Integrações", "Novidades"] },
  { title: "Recursos", links: ["Blog", "Especializações", "Webinars", "Central de Ajuda", "API"] },
  { title: "Empresa", links: ["Sobre nós", "Carreiras", "Contato", "Parceiros", "Imprensa"] },
  { title: "Legal", links: ["Privacidade", "Termos de Uso", "LGPD", "Cookies", "Segurança"] },
];

const FooterSection = () => (
  <footer className="bg-[hsl(210_30%_8%)] pt-16 pb-8 px-[5%] text-[hsl(0_0%_100%/0.7)]">
    <div className="max-w-[1200px] mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr_1fr] gap-10 pb-10 border-b border-[hsl(0_0%_100%/0.1)]">
        <div>
          <div className="flex items-center gap-2.5 mb-3.5">
            <div className="w-9 h-9 rounded-[9px] bg-primary flex items-center justify-center text-primary-foreground font-extrabold text-[15px]">PM</div>
            <span className="text-[hsl(0_0%_100%)] font-bold text-[17px]">PsicoManager</span>
          </div>
          <p className="text-[13px] leading-relaxed mb-5 max-w-[280px]">
            O sistema de gestão mais completo para psicólogos e clínicas de psicologia do Brasil.
          </p>
          <div className="flex gap-2">
            {["in", "f", "ig", "yt"].map(s => (
              <a key={s} href="#" className="w-[34px] h-[34px] rounded-lg border border-[hsl(0_0%_100%/0.15)] flex items-center justify-center text-[hsl(0_0%_100%/0.7)] text-sm no-underline hover:bg-primary hover:border-primary hover:text-primary-foreground transition-all">
                {s}
              </a>
            ))}
          </div>
        </div>

        {columns.map(col => (
          <div key={col.title}>
            <h4 className="text-[hsl(0_0%_100%)] text-sm font-bold mb-4">{col.title}</h4>
            <ul className="space-y-2.5 list-none">
              {col.links.map(link => (
                <li key={link}>
                  <a href="#" className="text-[hsl(0_0%_100%/0.55)] text-[13px] no-underline hover:text-primary-mid transition-colors">{link}</a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="pt-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs">
        <p className="text-[hsl(0_0%_100%/0.4)]">© 2025 PsicoManager. Todos os direitos reservados.</p>
        <div className="flex items-center gap-1.5 bg-[hsl(0_0%_100%/0.06)] border border-[hsl(0_0%_100%/0.1)] px-3 py-1.5 rounded-lg text-[hsl(0_0%_100%/0.5)] text-[11px]">
          🔒 Em conformidade com a LGPD
        </div>
      </div>
    </div>
  </footer>
);

export default FooterSection;
