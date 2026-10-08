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

/** Official income import, 13 fields. Receipt generation adds 3 fields. */
export function buildCarneLeaoCSV(rows: ReceitaRow[]): string {
  const lines = rows.map((r) => {
    const [y, m, d] = r.date.split("-");
    const hist = r.description.replace(/[;\r\n]/g, " ").slice(0, 255);
    return [`${d}/${m}/${y}`, "R01.001.001", "255", r.amount.toFixed(2).replace(".", ","), "", hist, "PF", onlyDigits(r.payerCpf), onlyDigits(r.beneficiaryCpf), "", "", "N", ""].join(";");
  });
  return lines.join("\r\n") + "\r\n";
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
