import {it,expect} from 'vitest';
import {anonymize} from '@/lib/anonymize';
it('removes known names and structured contact identifiers before AI transmission',()=>{
 const result=anonymize('Maria Silva, CPF 529.982.247-25, maria@example.com, (11) 99999-0000',['Maria Silva']);
 for(const value of ['Maria Silva','529.982.247-25','maria@example.com','99999-0000'])expect(result.includes(value)).toBe(false);
});
