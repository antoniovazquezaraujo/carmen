import { parseOctavePattern, printOctavePattern } from 'carmen-core';

describe('octave-pattern', () => {
    it('parsea enteros positivos, cero y negativos', () => {
        expect(parseOctavePattern('1 0 -1 2')).toEqual([1, 0, -1, 2]);
        expect(printOctavePattern([1, 0, -1, 2])).toBe('1 0 -1 2');
    });

    it('normaliza espacios y signos', () => {
        expect(parseOctavePattern('  +1   0  -1 ')).toEqual([1, 0, -1]);
    });

    it('rechaza un patrón vacío o no entero', () => {
        expect(() => parseOctavePattern('   ')).toThrow('al menos una octava');
        expect(() => parseOctavePattern('1 x')).toThrow("octava inválida 'x'");
    });
});
