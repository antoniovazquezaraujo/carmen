/**
 * Patrón de octavas: desplazamientos enteros relativos a `OCT`.
 *
 * `1 0 -1 2` repite la secuencia del bloque una octava arriba, en la octava
 * original, una abajo y dos arriba. No es una melodía: no admite duraciones ni
 * silencios.
 */
export function parseOctavePattern(text: string): number[] {
    const parts = text.trim().split(/\s+/).filter(part => part.length > 0);
    if (parts.length === 0) {
        throw new Error('OCTAVE_PATTERN necesita al menos una octava (p. ej. 1 0 -1 2)');
    }
    return parts.map(part => {
        if (!/^[+-]?\d+$/.test(part)) {
            throw new Error(`octava inválida '${part}': usa enteros relativos a OCT (p. ej. 1 0 -1 2)`);
        }
        return Number(part);
    });
}

/** Representación canónica de un patrón de octavas. */
export function printOctavePattern(values: readonly number[]): string {
    return values.join(' ');
}
