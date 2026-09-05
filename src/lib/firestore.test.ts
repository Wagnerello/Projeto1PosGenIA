import { describe, it, expect } from 'vitest';
import { generateInviteCode } from './firestore';

describe('generateInviteCode', () => {
  it('deve gerar um código com tamanho padrão de 8 caracteres', () => {
    const code = generateInviteCode();
    expect(code).toHaveLength(8);
  });

  it('deve gerar código com tamanho customizado quando especificado', () => {
    const code6 = generateInviteCode(6);
    const code12 = generateInviteCode(12);
    expect(code6).toHaveLength(6);
    expect(code12).toHaveLength(12);
  });

  it('não deve conter caracteres ambíguos (0, O, 1, I, L)', () => {
    const ambiguousChars = ['0', 'O', '1', 'I', 'L'];
    // Gera 50 códigos para validação estatística
    for (let i = 0; i < 50; i++) {
      const code = generateInviteCode(10);
      for (const char of ambiguousChars) {
        expect(code).not.toContain(char);
      }
    }
  });

  it('deve gerar códigos compostos apenas por caracteres permitidos no charset', () => {
    const validCharset = /^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]+$/;
    for (let i = 0; i < 20; i++) {
      const code = generateInviteCode(8);
      expect(code).toMatch(validCharset);
    }
  });
});
