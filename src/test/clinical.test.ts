import {describe,it,expect} from 'vitest';
import {documentEditable,financialEditable,CLINICAL_FIELDS} from '@/lib/clinical';
describe('Clinical safeguards',()=>{
 it('final documents are immutable',()=>{expect(documentEditable('final')).toBe(false);expect(documentEditable('rascunho')).toBe(true);});
 it('issued fiscal receipt locks financial edits',()=>{expect(financialEditable(true)).toBe(false);expect(financialEditable(false)).toBe(true);});
 it('records have the six requested sections',()=>{expect(CLINICAL_FIELDS).toEqual(['demanda','relato','observacoes_clinicas','intervencoes','evolucao','plano']);});
});
