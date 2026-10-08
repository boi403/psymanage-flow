import { jsPDF } from 'jspdf';
export const CLINICAL_FIELDS = ['demanda','relato','observacoes_clinicas','intervencoes','evolucao','plano'] as const;
export const FIELD_LABELS: Record<string,string> = { demanda:'Demanda', relato:'Relato', observacoes_clinicas:'Observações clínicas', intervencoes:'Intervenções', evolucao:'Evolução', plano:'Plano' };
export function documentEditable(status: string) { return status !== 'final'; }
export function financialEditable(receiptIssued: boolean) { return !receiptIssued; }
export function clinicalText(sections: Record<string,string>) { return CLINICAL_FIELDS.map(k=>`${FIELD_LABELS[k]}\n${sections[k] || 'Não registrado'}`).join('\n\n'); }
export function downloadClinicalPDF(title: string, text: string, filename='documento.pdf') {
 const doc = new jsPDF(); let y=22;
 doc.setFontSize(15); doc.text(doc.splitTextToSize(title,175),18,y); y+=20; doc.setFontSize(11);
 for(const line of doc.splitTextToSize(text,175) as string[]) { if(y>275){doc.addPage(); y=22;} doc.text(line,18,y); y+=6; }
 const pages=doc.getNumberOfPages(); for(let i=1;i<=pages;i++){doc.setPage(i);doc.setFontSize(9);doc.text(`${i} / ${pages}`,180,290);}
 doc.save(filename);
}
