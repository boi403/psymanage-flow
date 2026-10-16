export const onlyDigits = (s: string | null | undefined) => (s ?? "").replace(/\D/g, "");

export function isValidCPF(input: string | null | undefined): boolean {
  const c = onlyDigits(input);
  if (c.length !== 11 || /^(\d)\1{10}$/.test(c)) return false;
  const calc = (len: number) => {
    let sum = 0;
    for (let i = 0; i < len; i++) sum += Number(c[i]) * (len + 1 - i);
    const r = (sum * 10) % 11;
    return r === 10 ? 0 : r;
  };
  return calc(9) === Number(c[9]) && calc(10) === Number(c[10]);
}

export type ReceitaRow = {
  id: string;
  date: string; // YYYY-MM-DD
  amount: number;
  description: string;
  payerCpf: string | null;
  beneficiaryCpf: string | null;
};

/** Returns list of pending issues for one row (empty = ok). */
export function rowIssues(r: ReceitaRow): string[] {
  const issues: string[] = [];
  if (!isValidCPF(r.payerCpf)) issues.push("CPF do pagador inválido ou ausente");
  if (!isValidCPF(r.beneficiaryCpf)) issues.push("CPF do beneficiário inválido ou ausente");
  if (!(r.amount > 0)) issues.push("Valor deve ser maior que zero");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(r.date)) issues.push("Data inválida");
  return issues;
}

/**
 * Receita Saúde receipt layout (16 fields) from the official Carnê-Leão
 * manual: https://www.gov.br/receitafederal/pt-br/assuntos/meu-imposto-de-renda/pagamento/carne-leao/manual/formato-arquivo
 * This is NOT the generic 13-field income-import layout -- without fields
 * 14-16 (receipt flag "S", the professional's own CPF, and their council
 * registration), Receita Federal just logs plain income and never issues
 * the official digital receipt patients need, defeating the point of this
 * feature. "255" (field 3, occupation code) is fixed to Psicólogo per that
 * table.
 */
export function buildCarneLeaoCSV(rows: ReceitaRow[], professionalCpf: string, professionalCrp: string): string {
  const proCpf = onlyDigits(professionalCpf);
  const lines = rows.map((r) => {
    const [y, m, d] = r.date.split("-");
    const hist = r.description.replace(/[;\r\n]/g, " ").slice(0, 255);
    return [
      `${d}/${m}/${y}`, "R01.001.001", "255", r.amount.toFixed(2).replace(".", ","), "", hist, "PF",
      onlyDigits(r.payerCpf), onlyDigits(r.beneficiaryCpf),
      "", "", "", "", // 10 CPF-not-provided, 11 CNPJ, 12 IRRF indicator, 13 IRRF amount -- always blank for Receita Saúde
      "S", // 14: tells Receita Federal to generate the official receipt
      proCpf, // 15: professional's own CPF, must match their Carnê-Leão login
      professionalCrp.trim(), // 16: council registration printed on the receipt
    ].join(";");
  });
  return lines.join("\r\n") + "\r\n";
}

/** Preconditions for the whole export, not per-row (same professional for every line). */
export function professionalIssues(cpf: string | null | undefined, crp: string | null | undefined): string[] {
  const issues: string[] = [];
  if (!isValidCPF(cpf)) issues.push("Cadastre seu CPF (Configuração) para gerar recibos do Receita Saúde");
  if (!crp?.trim()) issues.push("Cadastre seu CRP (Configuração) para gerar recibos do Receita Saúde");
  return issues;
}

/** Encode text as ISO-8859-1 bytes (unsupported chars become "?"). */
export function encodeLatin1(text: string): Uint8Array {
  const out = new Uint8Array(text.length);
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    out[i] = code <= 0xff ? code : 0x3f;
  }
  return out;
}
