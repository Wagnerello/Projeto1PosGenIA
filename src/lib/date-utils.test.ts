import { describe, it, expect } from 'vitest';
import {
  parseDataSegura,
  formatarDataHora,
  formatarDataSimples,
  getTimestampMillis,
} from './date-utils';

describe('date-utils - Tratamento seguro de Timestamps e Datas', () => {
  it('deve converter objeto de Firestore Timestamp serializado ({ seconds, nanoseconds })', () => {
    // 2026-09-06 12:00:00 UTC = 1788700800
    const tsMock = { seconds: 1788700800, nanoseconds: 0 };
    const date = parseDataSegura(tsMock);
    expect(date).toBeInstanceOf(Date);
    expect(date?.getTime()).toBe(1788700800000);

    const formatted = formatarDataHora(tsMock);
    expect(typeof formatted).toBe('string');
    expect(formatted).not.toContain('[object Object]');
    expect(formatted.length).toBeGreaterThan(0);
  });

  it('deve converter Timestamp do SDK Firestore com método .toDate()', () => {
    const fixedDate = new Date('2026-09-06T15:30:00Z');
    const sdkMock = {
      toDate: () => fixedDate,
    };
    const date = parseDataSegura(sdkMock);
    expect(date?.getTime()).toBe(fixedDate.getTime());

    const formatted = formatarDataHora(sdkMock);
    expect(typeof formatted).toBe('string');
    expect(formatted.length).toBeGreaterThan(0);
  });

  it('deve tratar Date nativo corretamente', () => {
    const d = new Date('2026-05-10T10:00:00Z');
    expect(parseDataSegura(d)?.getTime()).toBe(d.getTime());
    expect(typeof formatarDataSimples(d)).toBe('string');
  });

  it('deve tratar string ISO e timestamp numérico', () => {
    const iso = '2026-09-06T14:00:00Z';
    expect(parseDataSegura(iso)).toBeInstanceOf(Date);
    expect(typeof formatarDataHora(iso)).toBe('string');

    const millis = 1788700800000;
    expect(parseDataSegura(millis)).toBeInstanceOf(Date);
    expect(getTimestampMillis(millis)).toBe(millis);
  });

  it('NUNCA deve retornar um objeto React invalid child em formatarDataHora ou formatarDataSimples', () => {
    // Objeto genérico desconhecido ou quebrado
    const objEstranho = { seconds: NaN, foo: 'bar' };
    const resHora = formatarDataHora(objEstranho, 'Recente');
    const resSimples = formatarDataSimples(objEstranho, 'Hoje');

    expect(typeof resHora).toBe('string');
    expect(resHora).toBe('Recente');

    expect(typeof resSimples).toBe('string');
    expect(resSimples).toBe('Hoje');

    // Null e Undefined
    expect(typeof formatarDataHora(null)).toBe('string');
    expect(typeof formatarDataHora(undefined)).toBe('string');
    expect(typeof formatarDataSimples(null)).toBe('string');
    expect(typeof formatarDataSimples(undefined)).toBe('string');
  });

  it('getTimestampMillis deve retornar 0 para valores inválidos e timestamp numérico para válidos', () => {
    expect(getTimestampMillis(null)).toBe(0);
    expect(getTimestampMillis(undefined)).toBe(0);
    expect(getTimestampMillis('invalido')).toBe(0);

    const tsMock = { seconds: 1500, nanoseconds: 0 };
    expect(getTimestampMillis(tsMock)).toBe(1500000);
  });
});
