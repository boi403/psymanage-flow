export const brl = (v: number | string | null | undefined) =>
  Number(v ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export const dateBR = (d: string | Date) => new Date(d).toLocaleDateString("pt-BR");
export const dateTimeBR = (d: string | Date) =>
  new Date(d).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });

export const PLANS = [
  { id: "Free", monthly: 0, yearly: 0 },
  { id: "Essencial", monthly: 89, yearly: 69 },
  { id: "Profissional", monthly: 149, yearly: 119 },
  { id: "Clínica", monthly: 299, yearly: 239 },
];
