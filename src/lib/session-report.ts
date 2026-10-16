import { jsPDF } from 'jspdf';
// Structure follows CFP Resolution 06/2019 (Relatório Psicológico, tipo
// "acompanhamento clínico"). Identificação and Encerramento are assembled
// from known data (see ReportMeta below), not AI-drafted -- only these 4
// sections are the model's output.
export const REPORT_SECTIONS = [
  ['descricao_demanda', 'Descrição da demanda'],
  ['procedimentos', 'Procedimentos realizados'],
  ['analise_psicologica', 'Análise psicológica'],
  ['conclusao', 'Conclusão'],
] as const;
export type ClinicalReport = Record<(typeof REPORT_SECTIONS)[number][0], string>;
export function isClinicalReport(value: unknown): value is ClinicalReport {
  return typeof value === 'object' && value !== null && REPORT_SECTIONS.every(([key]) => typeof (value as Record<string, unknown>)[key] === 'string');
}
export function reportCSV(report: ClinicalReport): string {
  const cell = (value: string) => `"${(/^[=+@\-\t\r]/.test(value) ? "'" : '') + value.replace(/"/g, '""')}"`;
  return '﻿' + ['Campo;Conteúdo', ...REPORT_SECTIONS.map(([key, label]) => `${cell(label)};${cell(report[key])}`)].join('\r\n');
}
export interface ReportMeta {
  patientName?: string;
  professionalName?: string;
  crp?: string;
  city?: string;
}
export function exportClinicalReport(report: ClinicalReport, format: 'pdf' | 'csv', sessionDate: string, meta: ReportMeta = {}) {
  if (format === 'csv') {
    const url = URL.createObjectURL(new Blob([reportCSV(report)], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a'); link.href = url; link.download = 'relatorio-psicologico.csv'; link.click(); URL.revokeObjectURL(url); return;
  }
  const pdf = new jsPDF(); let y = 22;
  const write = (text: string, size: number) => {
    pdf.setFontSize(size);
    const lines: string[] = pdf.splitTextToSize(text, 170);
    for (const line of lines) { if (y > 274) { pdf.addPage(); y = 22; } pdf.text(line, 20, y); y += size === 11 ? 6 : 8; }
    y += 3;
  };
  write('RELATÓRIO PSICOLÓGICO', 16);
  write('Rascunho gerado por IA — requer revisão e assinatura do(a) psicólogo(a) responsável. Documento confidencial.', 11);
  write('1. IDENTIFICAÇÃO', 13);
  write(`Pessoa atendida: ${meta.patientName || '[preencher]'}`, 11);
  write(`Finalidade: Relatório de acompanhamento clínico`, 11);
  write(`Psicólogo(a) responsável: ${meta.professionalName || '[preencher]'}`, 11);
  write(`CRP: ${meta.crp || '[preencher]'}`, 11);
  const sectionNumber: Record<string, string> = { descricao_demanda: '2. DESCRIÇÃO DA DEMANDA', procedimentos: '3. PROCEDIMENTOS', analise_psicologica: '4. ANÁLISE PSICOLÓGICA', conclusao: '5. CONCLUSÃO' };
  for (const [key] of REPORT_SECTIONS) { write(sectionNumber[key], 13); write(report[key], 11); }
  write('6. ENCERRAMENTO', 13);
  write(`${meta.city || '[Município]'}, ${sessionDate}.`, 11);
  y += 10;
  write('_______________________________', 11);
  write(meta.professionalName || '[Nome do(a) psicólogo(a)]', 11);
  write(`CRP ${meta.crp || '[número]'}`, 11);
  pdf.save('relatorio-psicologico.pdf');
}
