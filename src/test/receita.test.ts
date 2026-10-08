import { describe, it, expect } from "vitest";
import { isValidCPF, rowIssues, buildCarneLeaoCSV, encodeLatin1 } from "@/lib/receita";

describe("Receita Saúde", () => {
  it("validates CPF check digits", () => {
    expect(isValidCPF("529.982.247-25")).toBe(true);
    expect(isValidCPF("529.982.247-24")).toBe(false);
    expect(isValidCPF("111.111.111-11")).toBe(false);
  });
  it("flags pending issues per row", () => {
    const issues = rowIssues({ id: "1", date: "2026-10-01", amount: 200, description: "x", payerCpf: null, beneficiaryCpf: "52998224725" });
    expect(issues).toEqual(["CPF do pagador inválido ou ausente"]);
  });
  it("builds Carnê-Leão line", () => {
    const csv = buildCarneLeaoCSV([{ id: "1", date: "2026-10-01", amount: 200.5, description: "Sessão", payerCpf: "529.982.247-25", beneficiaryCpf: "52998224725" }]);
    expect(csv).toBe("01/10/2026;R01.001.001;255;200,50;;Sessão;PF;52998224725;52998224725;;;N;\r\n");
  });
  it("encodes ISO-8859-1", () => {
    expect(Array.from(encodeLatin1("ã"))).toEqual([0xe3]);
  });
});
