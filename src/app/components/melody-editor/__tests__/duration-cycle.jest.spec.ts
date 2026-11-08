/**
 * Anillo único de duración de la rueda (`duration-cycle.ts`).
 *
 * 10 estados: las 9 duraciones (incluidas `4m` y `2m`) + "blanco" (sin
 * duración explícita; la nota hereda la del grupo). Cada sentido recorre el
 * anillo completo y ambos pasan por los mismos valores (uno al revés del
 * otro); desde blanco, hacia largo se entra por `8t` y hacia corto por `4m`.
 * Sin reenganche por grupo/default.
 */
import { NoteDuration } from 'src/app/model/melody';
import { normalizeDuration, nextDuration, DurationDirection } from '../duration-cycle';

describe('duration-cycle · anillo único de duración', () => {
    it('normaliza duraciones: solo acepta las del ciclo', () => {
        expect(normalizeDuration('4n')).toBe('4n');
        expect(normalizeDuration('4m')).toBe('4m');
        expect(normalizeDuration('2m')).toBe('2m');
        expect(normalizeDuration('1m')).toBeUndefined(); // 1m = 1n en 4/4
        expect(normalizeDuration('3m')).toBeUndefined();
        expect(normalizeDuration('')).toBeUndefined();
        expect(normalizeDuration(undefined)).toBeUndefined();
        expect(normalizeDuration(null)).toBeUndefined();
        expect(normalizeDuration('4x')).toBeUndefined();
    });

    it('cada duración avanza al vecino correcto del anillo en ambos sentidos', () => {
        expect(nextDuration('4m', 'shorter')).toBe('2m');
        expect(nextDuration('2m', 'shorter')).toBe('1n');
        expect(nextDuration('1n', 'shorter')).toBe('2n');
        expect(nextDuration('2n', 'shorter')).toBe('4n');
        expect(nextDuration('4n', 'shorter')).toBe('8n');
        expect(nextDuration('8n', 'shorter')).toBe('16n');
        expect(nextDuration('16n', 'shorter')).toBe('4t');
        expect(nextDuration('4t', 'shorter')).toBe('8t');
        expect(nextDuration('8t', 'shorter')).toBeUndefined(); // blanco

        expect(nextDuration('8t', 'longer')).toBe('4t');
        expect(nextDuration('4t', 'longer')).toBe('16n');
        expect(nextDuration('16n', 'longer')).toBe('8n');
        expect(nextDuration('8n', 'longer')).toBe('4n');
        expect(nextDuration('4n', 'longer')).toBe('2n');
        expect(nextDuration('2n', 'longer')).toBe('1n');
        expect(nextDuration('1n', 'longer')).toBe('2m');
        expect(nextDuration('2m', 'longer')).toBe('4m');
        expect(nextDuration('4m', 'longer')).toBeUndefined(); // blanco
    });

    it('desde blanco cada sentido entra por un extremo del anillo', () => {
        expect(nextDuration(undefined, 'longer')).toBe('8t');
        expect(nextDuration(undefined, 'shorter')).toBe('4m');
    });

    it('los dos sentidos recorren los mismos estados (uno es el reverso del otro)', () => {
        const run = (direction: DurationDirection, steps: number): Array<NoteDuration | undefined> => {
            const visited: Array<NoteDuration | undefined> = [];
            let current: NoteDuration | undefined = undefined;
            for (let i = 0; i < steps; i += 1) {
                current = nextDuration(current, direction);
                visited.push(current);
            }
            return visited;
        };

        const longer = run('longer', 9);
        const shorter = run('shorter', 9);

        expect(longer).toEqual(['8t', '4t', '16n', '8n', '4n', '2n', '1n', '2m', '4m']);
        expect(shorter).toEqual([...longer].reverse()); // mismos valores, al revés
        expect(new Set([...longer, ...shorter]).size).toBe(9);

        // El 10.º paso de cada sentido completa la vuelta al blanco.
        expect(nextDuration('4m', 'longer')).toBeUndefined();
        expect(nextDuration('8t', 'shorter')).toBeUndefined();
    });

    it('el blanco sigue siendo alcanzable y siempre se sale de él', () => {
        expect(nextDuration('4m', 'longer')).toBeUndefined();
        expect(nextDuration('8t', 'shorter')).toBeUndefined();

        // Ida y vuelta: blanco → explícita → blanco → explícita.
        expect(nextDuration(undefined, 'longer')).toBe('8t');
        expect(nextDuration('8t', 'shorter')).toBeUndefined();
        expect(nextDuration(undefined, 'shorter')).toBe('4m');
        expect(nextDuration('4m', 'longer')).toBeUndefined();
        expect(nextDuration(undefined, 'longer')).toBe('8t');
    });

    it("normaliza `''`, `m` fuera del ciclo y duraciones desconocidas como blanco", () => {
        expect(nextDuration('', 'longer')).toBe('8t');
        expect(nextDuration('', 'shorter')).toBe('4m');
        expect(nextDuration('1m', 'longer')).toBe('8t');
        expect(nextDuration('3m', 'shorter')).toBe('4m');
        expect(nextDuration('4x', 'longer')).toBe('8t');
        expect(nextDuration('4x', 'shorter')).toBe('4m');
    });

    it('nunca repite estado: 40 pasos alternando sentidos', () => {
        let current: NoteDuration | undefined = undefined;
        for (let i = 0; i < 40; i += 1) {
            const next = nextDuration(current, i % 2 === 0 ? 'longer' : 'shorter');
            expect(next).not.toBe(current);
            current = next;
        }
    });
});
