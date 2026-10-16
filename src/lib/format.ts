export const brl = (v: number | string | null | undefined) =>
  Number(v ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export const dateBR = (d: string | Date) => new Date(d).toLocaleDateString("pt-BR");
export const dateTimeBR = (d: string | Date) =>
  new Date(d).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });

// Single source of truth for plan pricing/features -- used by both the public
// landing page (PricingSection.tsx) and the in-app subscription picker
// (pages/dashboard/Planos.tsx), which used to each hold their own copy.
export const PLANS = [
  {
    id: "Free", desc: "Para quem está começando", monthly: 0, yearly: 0,
    features: ["Até 5 pacientes", "Agenda básica", "Prontuário simplificado", "1 sala virtual/mês"],
    disabled: ["Financeiro", "Relatórios", "App mobile"],
  },
  {
    id: "Essencial", desc: "Para consultório individual", monthly: 89, yearly: 69,
    features: ["Até 30 pacientes", "Agenda completa", "Prontuário eletrônico", "Sala virtual ilimitada", "Controle financeiro"],
    disabled: ["Relatórios avançados", "Multi-profissional"],
  },
  {
    id: "Profissional", desc: "O mais completo para autônomos", monthly: 149, yearly: 119, popular: true,
    features: ["Pacientes ilimitados", "Todas as funcionalidades", "Relatórios avançados", "App mobile", "PsicoBank", "Suporte prioritário"],
    disabled: [],
  },
  {
    id: "Clínica", desc: "Para quem quer o pacote completo com atendimento prioritário", monthly: 299, yearly: 239,
    features: ["Tudo do Profissional", "Onboarding guiado", "Suporte dedicado com prioridade", "Prioridade em novas funcionalidades"],
    disabled: [],
  },
] as const;
