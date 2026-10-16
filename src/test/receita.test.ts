import { describe, it, expect } from "vitest";
import { isValidCPF, rowIssues, buildCarneLeaoCSV, encodeLatin1, professionalIssues } from "@/lib/receita";

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
  it("builds a 16-field Receita Saúde receipt line (not the generic 13-field income layout)", () => {
    const csv = buildCarneLeaoCSV([{ id: "1", date: "2026-10-01", amount: 200.5, description: "Sessão", payerCpf: "529.982.247-25", beneficiaryCpf: "52998224725" }], "529.982.247-25", "06/12345");
    expect(csv).toBe("01/10/2026;R01.001.001;255;200,50;;Sessão;PF;52998224725;52998224725;;;;;S;52998224725;06/12345\r\n");
  });
  it("encodes ISO-8859-1", () => {
    expect(Array.from(encodeLatin1("ã"))).toEqual([0xe3]);
  });
  it("requires the professional's own CPF and CRP before export", () => {
    expect(professionalIssues(null, null)).toHaveLength(2);
    expect(professionalIssues("529.982.247-25", "06/12345")).toEqual([]);
  });
});
