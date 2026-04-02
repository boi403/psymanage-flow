import { useState } from "react";

const tabs = [
  { id: "autonomo", label: "Autônomo" },
  { id: "clinica", label: "Clínica" },
];

const content: Record<string, { title: string; desc: string; features: string[] }> = {
  autonomo: {
    title: "Para psicólogos autônomos",
    desc: "Simplifique sua rotina e foque no que importa: seus pacientes.",
    features: [
      "Agenda online com autoagendamento",
      "Prontuário eletrônico seguro",
      "Controle financeiro integrado",
      "Sala virtual para atendimento online",
      "Emissão de recibos automática",
      "App mobile para gerenciar de qualquer lugar",
    ],
  },
  clinica: {
    title: "Para clínicas e consultórios",
    desc: "Gerencie múltiplos profissionais com visão completa do negócio.",
    features: [
      "Multi-profissionais com permissões",
      "Dashboard administrativo completo",
      "Split de pagamento automático",
      "Relatórios por profissional",
      "Gestão de salas e recursos",
      "Controle de comissões",
    ],
  },
};

const ForWhoSection = () => {
  const [active, setActive] = useState("autonomo");
  const data = content[active];

  return (
    <section id="para-quem" className="bg-muted py-20 px-[5%]">
      <div className="max-w-[1200px] mx-auto">
        <div className="mb-10">
          <div className="inline-flex items-center gap-1.5 text-primary text-[13px] font-bold uppercase tracking-wider mb-3">
            <span className="inline-block w-5 h-0.5 bg-primary rounded" />
            Para quem
          </div>
          <h2 className="text-3xl md:text-[38px] font-extrabold text-foreground leading-tight mb-3.5">
            Ideal para cada <span className="text-primary">realidade</span>
          </h2>
        </div>

        <div className="flex gap-1 bg-border p-1 rounded-xl w-fit mb-10">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setActive(t.id)}
              className={`px-6 py-2.5 rounded-[9px] text-[15px] font-semibold transition-all cursor-pointer border-none font-sans ${
                active === t.id ? "bg-card text-primary-dark shadow-sm" : "text-muted-foreground bg-transparent"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <h3 className="text-2xl font-extrabold text-foreground mb-3">{data.title}</h3>
            <p className="text-muted-foreground mb-6">{data.desc}</p>
            <ul className="space-y-2.5">
              {data.features.map(f => (
                <li key={f} className="flex items-center gap-3 text-[15px] text-muted-foreground">
                  <span className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-extrabold shrink-0">✓</span>
                  {f}
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-card rounded-xl border border-border shadow-brand overflow-hidden">
            {active === "clinica" ? (
              <>
                <div className="gradient-primary px-5 py-4">
                  <div className="text-primary-foreground font-bold text-sm">Clínica Mente Saudável</div>
                  <div className="text-primary-foreground/70 text-[11px] mt-0.5">3 profissionais · 142 pacientes</div>
                </div>
                <div className="p-4 space-y-2">
                  {[
                    { initials: "MA", name: "Dra. Marina Alves", sessions: "28 sessões/mês", value: "R$ 5.600", bg: "bg-primary" },
                    { initials: "CL", name: "Dr. Carlos Lima", sessions: "22 sessões/mês", value: "R$ 4.400", bg: "bg-indigo-500" },
                    { initials: "PR", name: "Dra. Paula Ribeiro", sessions: "18 sessões/mês", value: "R$ 3.600", bg: "bg-rose-500" },
                  ].map(p => (
                    <div key={p.name} className="flex items-center gap-2.5 p-2.5 rounded-[10px] bg-muted border border-border">
                      <div className={`w-9 h-9 rounded-full ${p.bg} flex items-center justify-center text-primary-foreground font-extrabold text-xs shrink-0`}>{p.initials}</div>
                      <div className="flex-1">
                        <div className="text-xs font-bold text-foreground">{p.name}</div>
                        <div className="text-[10px] text-muted-foreground">{p.sessions}</div>
                      </div>
                      <div className="text-xs font-bold text-primary-dark">{p.value}</div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="p-8 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl gradient-primary flex items-center justify-center text-3xl">👩‍⚕️</div>
                <h4 className="text-lg font-bold text-foreground mb-2">Seu consultório, simplificado</h4>
                <p className="text-sm text-muted-foreground">Tudo que você precisa para gerenciar seus atendimentos em um só lugar.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ForWhoSection;
