const testimonials = [
  { name: "Dra. Camila Ferreira", role: "Psicóloga Clínica · SP", text: "O PsicoManager transformou minha rotina. Reduzi faltas em 80% com os lembretes automáticos e o prontuário é simplesmente incrível.", initials: "CF", bg: "bg-primary" },
  { name: "Dr. Lucas Andrade", role: "Psicólogo · RJ", text: "Uso há 2 anos e não consigo imaginar meu consultório sem. O controle financeiro me deu clareza sobre meu negócio como nunca tive.", initials: "LA", bg: "bg-indigo-500" },
  { name: "Dra. Mariana Costa", role: "Clínica PsicoVida · MG", text: "Gerenciar 5 profissionais era um pesadelo até conhecermos o PsicoManager. O split de pagamento e os relatórios por profissional são perfeitos.", initials: "MC", bg: "bg-rose-500" },
];

const TestimonialsSection = () => (
  <section className="py-20 px-[5%]">
    <div className="max-w-[1200px] mx-auto">
      <div className="mb-14 text-center">
        <div className="inline-flex items-center gap-1.5 text-primary text-[13px] font-bold uppercase tracking-wider mb-3">
          <span className="inline-block w-5 h-0.5 bg-primary rounded" />
          Depoimentos
        </div>
        <h2 className="text-3xl md:text-[38px] font-extrabold text-foreground leading-tight mb-3.5">
          O que dizem nossos <span className="text-primary">psicólogos</span>
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {testimonials.map(t => (
          <div key={t.name} className="bg-card rounded-xl p-7 border border-border relative">
            <div className="text-amber-500 text-[15px] mb-3.5">★★★★★</div>
            <p className="text-sm text-muted-foreground leading-relaxed mb-5 italic">"{t.text}"</p>
            <div className="flex items-center gap-2.5">
              <div className={`w-10 h-10 rounded-full ${t.bg} flex items-center justify-center text-primary-foreground font-extrabold text-sm shrink-0`}>{t.initials}</div>
              <div>
                <div className="text-[13px] font-bold text-foreground">{t.name}</div>
                <div className="text-[11px] text-muted-foreground">{t.role}</div>
              </div>
            </div>
            <div className="absolute top-6 right-6 text-2xl">💬</div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default TestimonialsSection;
