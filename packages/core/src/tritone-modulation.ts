import { Scale, ScaleTypes } from './scale';
import { NotePair, tritonesOf } from './scale-view';

/**
 * Tritone anchoring (ADR-005): given a source scale and a destination scale,
 * align one source tritone with one destination tritone and derive the exact
 * key. The result also reports which tritones stay, are added and disappear.
 */
export interface ModulationResult {
    readonly source: ScaleTypes;
    readonly target: ScaleTypes;
    readonly fromOrdinal: number;
    readonly toOrdinal: number;
    /** Exact pitch-class transposition, 0..11. */
    readonly key: number;
    readonly targetTritones: readonly NotePair[];
    readonly fixed: readonly NotePair[];
    readonly added: readonly NotePair[];
    readonly removed: readonly NotePair[];
}

function modulo(value: number, divisor: number): number {
    return ((value % divisor) + divisor) % divisor;
}

function normalizePair(a: number, b: number): NotePair {
    const start = modulo(a, 12);
    const end = modulo(b, 12);
    return start < end ? [start, end] : [end, start];
}

function pairKey([start, end]: NotePair): string {
    return `${start}:${end}`;
}

function sortedPairs(pairs: readonly NotePair[]): NotePair[] {
    return [...pairs].sort((left, right) => left[0] - right[0] || left[1] - right[1]);
}

function assertOrdinal(ordinal: number, count: number, label: string): void {
    if (!Number.isInteger(ordinal) || ordinal < 1 || ordinal > count) {
        throw new RangeError(`${label} ordinal ${ordinal} is outside 1..${count}`);
    }
}

/**
 * Anchor a source tritone to a target tritone.
 *
 * `sourceKey` is the current transposition of the source scale; the source
 * tritone starts at `base + sourceKey`. The target starts at its base position,
 * so the returned key is the new transposition for the target scale.
 */
export function modulate(
    source: ScaleTypes,
    target: ScaleTypes,
    fromOrdinal: number,
    toOrdinal: number,
    sourceKey = 0
): ModulationResult {
    const sourceTritones = tritonesOf(Scale.getScaleByType(source).notes);
    const targetTritonesBase = tritonesOf(Scale.getScaleByType(target).notes);

    assertOrdinal(fromOrdinal, sourceTritones.length, `${ScaleTypes[source]} source tritone`);
    assertOrdinal(toOrdinal, targetTritonesBase.length, `${ScaleTypes[target]} target tritone`);

    const sourceStart = modulo(sourceTritones[fromOrdinal - 1][0] + sourceKey, 12);
    const targetStart = targetTritonesBase[toOrdinal - 1][0];
    const key = modulo(sourceStart - targetStart, 12);

    const actualSource = sortedPairs(
        sourceTritones.map(([start, end]) => normalizePair(start + sourceKey, end + sourceKey))
    );
    const targetTritones = sortedPairs(
        targetTritonesBase.map(([start, end]) => normalizePair(start + key, end + key))
    );

    const sourceKeys = new Set(actualSource.map(pairKey));
    const targetKeys = new Set(targetTritones.map(pairKey));

    const fixed = actualSource.filter(pair => targetKeys.has(pairKey(pair)));
    const added = targetTritones.filter(pair => !sourceKeys.has(pairKey(pair)));
    const removed = actualSource.filter(pair => !targetKeys.has(pairKey(pair)));

    return {
        source,
        target,
        fromOrdinal,
        toOrdinal,
        key,
        targetTritones,
        fixed,
        added,
        removed
    };
}
