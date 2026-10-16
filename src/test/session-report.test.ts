import { describe, expect, it } from 'vitest';
import { isClinicalReport, reportCSV } from '../lib/session-report';
const report = { descricao_demanda: 'Ansiedade relatada pelo paciente; texto "citado"; novo\nparágrafo', procedimentos: 'Entrevista clínica', analise_psicologica: 'Não informado na sessão', conclusao: '=HYPERLINK("x")' };
describe('clinical report data', () => {
  it('requires every structured clinical field to be a string', () => { expect(isClinicalReport(report)).toBe(true); expect(isClinicalReport({ ...report, conclusao: null })).toBe(false); expect(isClinicalReport({ descricao_demanda: 'parcial' })).toBe(false); });
  it('exports all clinical sections, preserving quoted multiline content and neutralizing formulas', () => {
    const csv = reportCSV(report); expect(csv.startsWith('﻿')).toBe(true); expect(csv).toContain('"Descrição da demanda";"Ansiedade relatada pelo paciente; texto ""citado""; novo\nparágrafo"'); expect(csv).toContain('"Conclusão";"\'=HYPERLINK(""x"")"'); expect(csv).toContain('"Procedimentos realizados";"Entrevista clínica"');
  });
});
