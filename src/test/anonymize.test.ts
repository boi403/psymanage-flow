import {it,expect} from 'vitest';
import {anonymize} from '@/lib/anonymize';
it('removes known names and structured contact identifiers before AI transmission',()=>{
 const result=anonymize('Maria Silva, CPF 529.982.247-25, maria@example.com, (11) 99999-0000',['Maria Silva']);
 for(const value of ['Maria Silva','529.982.247-25','maria@example.com','99999-0000'])expect(result.includes(value)).toBe(false);
});
it('redacts individual name tokens, not only an exact full-name match',()=>{
 const result=anonymize('a Maria contou que o Souza brigou com ela',['Maria Aparecida Souza']);
 expect(result).not.toContain('Maria');
 expect(result).not.toContain('Souza');
});
it('redacts accented name variants case-insensitively',()=>{
 const result=anonymize('o Jose chegou atrasado',['José']);
 expect(result).not.toContain('Jose');
});
it('redacts RG, CEP and street addresses',()=>{
 const result=anonymize('mora na Rua das Flores, 120, CEP 01310-100, RG 12.345.678-9',[]);
 expect(result).not.toContain('Rua das Flores, 120');
 expect(result).not.toContain('01310-100');
 expect(result).not.toContain('12.345.678-9');
});
