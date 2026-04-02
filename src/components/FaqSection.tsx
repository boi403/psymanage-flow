import { useState } from "react";

const faqs = [
  { q: "O PsicoManager é seguro para dados dos pacientes?", a: "Sim! Utilizamos criptografia de ponta a ponta e estamos em total conformidade com a LGPD e resoluções do CFP. Seus dados e dos seus pacientes estão 100% protegidos." },
  { q: "Posso testar gratuitamente antes de assinar?", a: "Sim! Oferecemos 15 dias grátis em todos os planos pagos, sem necessidade de cartão de crédito. Ao final, você escolhe se quer continuar." },
  { q: "Funciona para clínicas com múltiplos profissionais?", a: "Sim! O plano Clínica foi desenvolvido especialmente para clínicas, com gestão multi-profissional, split de pagamento e dashboard administrativo." },
  { q: "O prontuário está de acordo com o CFP?", a: "Sim! Nosso prontuário eletrônico segue todas as resoluções do Conselho Federal de Psicologia e está adequado à LGPD." },
  { q: "Posso cancelar a qualquer momento?", a: "Sim! Não há fidelidade. Você pode cancelar quando quiser sem multa ou burocracia." },
  { q: "Como funciona o suporte?", a: "Oferecemos suporte por chat, e-mail e WhatsApp. Planos Profissional e Clínica contam com suporte prioritário e dedicado." },
  { q: "Os certificados das especializações são reconhecidos?", a: "Sim! Os certificados possuem verificação online e são válidos para horas complementares e desenvolvimento profissional contínuo." },
  { q: "Posso importar dados de outro sistema?", a: "Sim! Oferecemos importação assistida de dados de outros sistemas. Nossa equipe ajuda na migração sem perda de informações." },
];

const FaqSection = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section id="faq" className="bg-muted py-20 px-[5%]">
      <div className="max-w-[1200px] mx-auto">
        <div className="mb-14 text-center">
          <div className="inline-flex items-center gap-1.5 text-primary text-[13px] font-bold uppercase tracking-wider mb-3">
            <span className="inline-block w-5 h-0.5 bg-primary rounded" />
            FAQ
          </div>
          <h2 className="text-3xl md:text-[38px] font-extrabold text-foreground leading-tight mb-3.5">
            Perguntas <span className="text-primary">frequentes</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {faqs.map((faq, i) => (
            <div key={i} className="bg-card rounded-lg border border-border overflow-hidden">
              <button
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="w-full px-5 py-4 text-[15px] font-semibold text-foreground cursor-pointer flex justify-between items-center text-left bg-transparent border-none font-sans"
              >
                {faq.q}
                <span className="text-xl text-primary font-light ml-4 shrink-0">{openIndex === i ? "−" : "+"}</span>
              </button>
              <div className={`overflow-hidden transition-all duration-300 ${openIndex === i ? "max-h-52 pb-4" : "max-h-0"}`}>
                <p className="px-5 text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FaqSection;
