/**
 * Experimental tritone lab.
 *
 * This module is intentionally not wired into the parser, player or GUI yet.
 * It is a small, pure playground for the model described in ADR-005:
 *
 * - a tritone is represented by its two pitch classes `(start, start + 6)`;
 * - a modulation anchors one source tritone to one destination tritone;
 * - the exact key is the real pitch-class distance, modulo 12;
 * - hiding a tritone removes both of its notes and reindexes the visible scale.
 *
 * Run its tests with:
 *
 *   npm test -- tritone-lab
 */

export type TritoneScaleName = 'WHITE' | 'BLUE' | 'RED' | 'TONES' | 'BLACK';

export type TritonePair = readonly [number, number];

export interface TritoneScale {
    readonly name: TritoneScaleName;
    readonly notes: readonly number[];
    readonly tritones: readonly TritonePair[];
}

export type HideSelection = 'LOW' | 'HIGH' | 'ALL';

export interface ModulationResult {
    readonly source: TritoneScaleName;
    readonly target: TritoneScaleName;
    readonly fromOrdinal: number;
    readonly toOrdinal: number;
    /** Exact pitch-class transposition, 0..11. */
    readonly key: number;
    readonly targetTritones: readonly TritonePair[];
    readonly fixed: readonly TritonePair[];
    readonly added: readonly TritonePair[];
    readonly removed: readonly TritonePair[];
}

export interface HiddenScale {
    readonly name: TritoneScaleName;
    readonly selection: HideSelection;
    readonly hiddenTritones: readonly TritonePair[];
    /** Visible notes in ascending order. Their index is the new visible degree. */
    readonly notes: readonly number[];
    readonly tritones: readonly TritonePair[];
}

const SCALE_NOTES: Record<TritoneScaleName, readonly number[]> = {
    WHITE: [0, 2, 3, 5, 7, 9, 10],
    BLUE: [0, 2, 4, 5, 7, 8, 10],
    RED: [0, 1, 4, 5, 7, 8, 11],
    TONES: [0, 2, 4, 6, 8, 10],
    BLACK: [1, 2, 4, 5, 7, 8, 10, 11]
};

function modulo(value: number, divisor: number): number {
    return ((value % divisor) + divisor) % divisor;
}

function normalizePair(a: number, b: number): TritonePair {
    const start = modulo(a, 12);
    const end = modulo(b, 12);
    return start < end ? [start, end] : [end, start];
}

function pairKey([start, end]: TritonePair): string {
    return `${start}:${end}`;
}

function sortedPairs(pairs: readonly TritonePair[]): TritonePair[] {
    return [...pairs].sort((left, right) => left[0] - right[0] || left[1] - right[1]);
}

function findTritones(notes: readonly number[]): TritonePair[] {
    const noteSet = new Set(notes);
    const pairs: TritonePair[] = [];

    for (const start of notes) {
        const end = modulo(start + 6, 12);
        if (noteSet.has(end) && start < end) {
            pairs.push([start, end]);
        }
    }

    return sortedPairs(pairs);
}

function buildScale(name: TritoneScaleName): TritoneScale {
    const notes = SCALE_NOTES[name];
    return { name, notes, tritones: findTritones(notes) };
}

export const TRITONE_SCALES: Readonly<Record<TritoneScaleName, TritoneScale>> = {
    WHITE: buildScale('WHITE'),
    BLUE: buildScale('BLUE'),
    RED: buildScale('RED'),
    TONES: buildScale('TONES'),
    BLACK: buildScale('BLACK')
};

/** Starts of the tritones in a scale, relative to root 0. */
export function tritoneStarts(name: TritoneScaleName): readonly number[] {
    return TRITONE_SCALES[name].tritones.map(([start]) => start);
}

function assertOrdinal(ordinal: number, count: number, label: string): void {
    if (!Number.isInteger(ordinal) || ordinal < 1 || ordinal > count) {
        throw new RangeError(`${label} ordinal ${ordinal} is outside 1..${count}`);
    }
}

/**
 * Anchor a source tritone to a target tritone and return the exact key and the
 * tritone-level edit.
 */
export function modulate(
    source: TritoneScaleName,
    target: TritoneScaleName,
    fromOrdinal: number,
    toOrdinal: number
): ModulationResult {
    const sourceScale = TRITONE_SCALES[source];
    const targetScale = TRITONE_SCALES[target];

    assertOrdinal(fromOrdinal, sourceScale.tritones.length, `${source} source tritone`);
    assertOrdinal(toOrdinal, targetScale.tritones.length, `${target} target tritone`);

    const sourcePair = sourceScale.tritones[fromOrdinal - 1];
    const targetPair = targetScale.tritones[toOrdinal - 1];
    const key = modulo(sourcePair[0] - targetPair[0], 12);

    const targetTritones = sortedPairs(
        targetScale.tritones.map(([start, end]) => normalizePair(start + key, end + key))
    );
    const sourceKeys = new Set(sourceScale.tritones.map(pairKey));
    const targetKeys = new Set(targetTritones.map(pairKey));

    const fixed = sourceScale.tritones.filter(pair => targetKeys.has(pairKey(pair)));
    const added = targetTritones.filter(pair => !sourceKeys.has(pairKey(pair)));
    const removed = sourceScale.tritones.filter(pair => !targetKeys.has(pairKey(pair)));

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

/**
 * Hide one or all tritones of a scale.
 *
 * The returned notes are the visible scale in ascending order. Their array
 * index is the new visible degree: if the parent had 7 notes and two are hidden,
 * the visible degrees are 0..4.
 */
export function hideTritones(name: TritoneScaleName, selection: HideSelection): HiddenScale {
    const scale = TRITONE_SCALES[name];
    if (scale.tritones.length === 0) {
        throw new RangeError(`${name} has no tritones to hide`);
    }

    const hiddenTritones =
        selection === 'ALL'
            ? scale.tritones
            : selection === 'LOW'
              ? [scale.tritones[0]]
              : [scale.tritones[scale.tritones.length - 1]];

    const hiddenNotes = new Set<number>();
    for (const [start, end] of hiddenTritones) {
        hiddenNotes.add(start);
        hiddenNotes.add(end);
    }

    const notes = scale.notes.filter(note => !hiddenNotes.has(note));
    return {
        name,
        selection,
        hiddenTritones,
        notes,
        tritones: findTritones(notes)
    };
}

/** Small human-readable report for the lab. */
export function formatModulation(result: ModulationResult): string {
    const pairs = (items: readonly TritonePair[]): string =>
        items.length === 0 ? '∅' : items.map(([start, end]) => `(${start},${end})`).join(' ');
    return [
        `${result.source} -> ${result.target} (${result.fromOrdinal}->${result.toOrdinal})`,
        `key=${result.key}`,
        `fixed=${pairs(result.fixed)}`,
        `added=${pairs(result.added)}`,
        `removed=${pairs(result.removed)}`
    ].join(' | ');
}
