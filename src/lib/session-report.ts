import { jsPDF } from 'jspdf';
export const REPORT_SECTIONS = [
  ['resumo', 'Resumo da sessão'], ['demanda', 'Demanda'], ['relato', 'Relato'],
  ['observacoes_clinicas', 'Observações clínicas'], ['intervencoes', 'Intervenções'],
  ['evolucao', 'Evolução'], ['plano', 'Plano terapêutico'],
] as const;
export type ClinicalReport = Record<(typeof REPORT_SECTIONS)[number][0], string>;
export function isClinicalReport(value: unknown): value is ClinicalReport {
  return typeof value === 'object' && value !== null && REPORT_SECTIONS.every(([key]) => typeof (value as Record<string, unknown>)[key] === 'string');
}
export function reportCSV(report: ClinicalReport): string {
  const cell = (value: string) => `"${(/^[=+@\-\t\r]/.test(value) ? "'" : '') + value.replace(/"/g, '""')}"`;
  return '\uFEFF' + ['Campo;Conteúdo', ...REPORT_SECTIONS.map(([key, label]) => `${cell(label)};${cell(report[key])}`)].join('\r\n');
}
export function exportClinicalReport(report: ClinicalReport, format: 'pdf' | 'csv', sessionDate: string) {
  if (format === 'csv') {
    const url = URL.createObjectURL(new Blob([reportCSV(report)], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a'); link.href = url; link.download = 'relatorio-clinico.csv'; link.click(); URL.revokeObjectURL(url); return;
  }
  const pdf = new jsPDF(); let y = 22;
  const write = (text: string, size: number) => {
    pdf.setFontSize(size);
    const lines: string[] = pdf.splitTextToSize(text, 170);
    for (const line of lines) { if (y > 274) { pdf.addPage(); y = 22; } pdf.text(line, 20, y); y += size === 11 ? 6 : 8; }
    y += 3;
  };
  write('PsicoManager — Relatório clínico', 16);
  write(`Sessão: ${sessionDate} | Rascunho gerado por IA`, 11);
  write('Documento confidencial. Requer revisão do psicólogo responsável.', 11);
  for (const [key, label] of REPORT_SECTIONS) { write(label, 13); write(report[key], 11); }
  pdf.save('relatorio-clinico.pdf');
}
