/**
 * Intensidad: velocidades MIDI y perfil de un preset.
 *
 * Los valores son MIDI 1–127. `undefined` significa "sin valor explícito";
 * en reproducción/MIDI se resuelve con el perfil del preset o con 90.
 */

export const DEFAULT_VELOCITY = 90;
export const MIN_VELOCITY = 1;
export const MAX_VELOCITY = 127;

export interface VelocityRamp {
    /** Primera nota generada del bloque, 1-based. */
    from: number;
    /** Última nota generada del bloque, 1-based (inclusive). */
    to: number;
    fromVelocity: number;
    toVelocity: number;
}

export function clampVelocity(value: number): number {
    if (!Number.isFinite(value)) {
        return DEFAULT_VELOCITY;
    }
    return Math.max(MIN_VELOCITY, Math.min(MAX_VELOCITY, Math.round(value)));
}

export function isVelocity(value: number): boolean {
    return Number.isInteger(value) && value >= MIN_VELOCITY && value <= MAX_VELOCITY;
}

/** "20 10 5" -> [20, 10, 5]. Lanza si algún valor no es una velocidad válida. */
export function parseVelocityPattern(text: string): number[] {
    const parts = text.trim().split(/\s+/).filter(part => part !== '');
    if (parts.length === 0) {
        throw new Error('el patrón de velocidades está vacío');
    }
    return parts.map(part => {
        if (!/^[1-9][0-9]*$/.test(part)) {
            throw new Error(`velocidad inválida '${part}': usa enteros entre 1 y 127`);
        }
        const value = Number(part);
        if (!isVelocity(value)) {
            throw new Error(`velocidad fuera de rango '${part}': usa enteros entre 1 y 127`);
        }
        return value;
    });
}

export function printVelocityPattern(values: readonly number[]): string {
    return values.map(value => String(clampVelocity(value))).join(' ');
}

/** "4 11 20 60" -> rampa de la nota 4 a la 11, de 20 a 60. */
export function parseVelocityRamp(text: string): VelocityRamp {
    const parts = text.trim().split(/\s+/).filter(part => part !== '');
    if (parts.length !== 4) {
        throw new Error('la rampa de velocidades necesita 4 enteros: nota inicial, nota final, velocidad inicial y velocidad final');
    }
    const [fromText, toText, fromVelocityText, toVelocityText] = parts;
    const parsePositive = (value: string, what: string): number => {
        if (!/^[1-9][0-9]*$/.test(value)) {
            throw new Error(`${what} debe ser un entero positivo (recibido '${value}')`);
        }
        return Number(value);
    };
    const parseVel = (value: string): number => {
        if (!/^[1-9][0-9]*$/.test(value)) {
            throw new Error(`velocidad inválida '${value}': usa enteros entre 1 y 127`);
        }
        const velocity = Number(value);
        if (!isVelocity(velocity)) {
            throw new Error(`velocidad fuera de rango '${value}': usa enteros entre 1 y 127`);
        }
        return velocity;
    };
    const from = parsePositive(fromText, 'la nota inicial');
    const to = parsePositive(toText, 'la nota final');
    if (from > to) {
        throw new Error(`la nota inicial (${from}) no puede ser mayor que la final (${to})`);
    }
    return {
        from,
        to,
        fromVelocity: parseVel(fromVelocityText),
        toVelocity: parseVel(toVelocityText)
    };
}

export function printVelocityRamp(ramp: VelocityRamp): string {
    return [ramp.from, ramp.to, ramp.fromVelocity, ramp.toVelocity].join(' ');
}

/** Interpola la velocity de la posición `index` (1-based) dentro de la rampa. */
export function velocityAtRampPosition(ramp: VelocityRamp, index: number): number | undefined {
    if (index < ramp.from || index > ramp.to) {
        return undefined;
    }
    if (ramp.from === ramp.to) {
        return clampVelocity(ramp.fromVelocity);
    }
    const ratio = (index - ramp.from) / (ramp.to - ramp.from);
    return clampVelocity(ramp.fromVelocity + (ramp.toVelocity - ramp.fromVelocity) * ratio);
}
