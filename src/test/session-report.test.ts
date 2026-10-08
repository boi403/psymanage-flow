import { describe, expect, it } from 'vitest';
import { isClinicalReport, reportCSV } from '../lib/session-report';
const report = { resumo: 'Sessão', demanda: 'Ansiedade', relato: 'Texto "citado"; novo\nparágrafo', observacoes_clinicas: 'Não informado', intervencoes: 'Escuta', evolucao: 'Estável', plano: '=HYPERLINK("x")' };
describe('clinical report data', () => {
  it('requires every structured clinical field to be a string', () => { expect(isClinicalReport(report)).toBe(true); expect(isClinicalReport({ ...report, plano: null })).toBe(false); expect(isClinicalReport({ resumo: 'parcial' })).toBe(false); });
  it('exports all clinical sections, preserving quoted multiline content and neutralizing formulas', () => {
    const csv = reportCSV(report); expect(csv.startsWith('\uFEFF')).toBe(true); expect(csv).toContain('"Relato";"Texto ""citado""; novo\nparágrafo"'); expect(csv).toContain('"Plano terapêutico";"\'=HYPERLINK(""x"")"'); expect(csv).toContain('"Demanda";"Ansiedade"');
  });
});
