/** Known identifiers plus common structured PII, before transmission to AI. */
export function anonymize(text: string, identifiers: (string|null|undefined)[]): string {
 let result=text;
 for(const value of identifiers.filter((s):s is string=>!!s?.trim()).sort((a,b)=>b.length-a.length)) {
  const escaped=value.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  result=result.replace(new RegExp(escaped,'gi'),'[IDENTIDADE REMOVIDA]');
 }
 return result.replace(/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/g,'[EMAIL REMOVIDO]').replace(/\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/g,'[CPF REMOVIDO]').replace(/(?:\+?55\s*)?\(?\d{2}\)?[\s.-]*\d{4,5}[\s.-]*\d{4}\b/g,'[TELEFONE REMOVIDO]');
}
