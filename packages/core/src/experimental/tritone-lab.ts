/**
 * Experimental tritone lab.
 *
 * This module is intentionally not wired into the parser, player or GUI yet.
 * It is a small, pure playground for the model described in ADR-005:
 *
 * - a tritone is represented by its two pitch classes `(start, start + 6)`;
 * - a modulation anchors one source tritone to one destination tritone;
 * - the exact key is the real pitch-class distance, modulo 12;
 * - hiding collapses the semitones that touch a tritone: one note of each
 *   semitone survives, which yields four semitone-free views in WHITE and BLUE.
 *
 * Run its tests with:
 *
 *   npm test -- tritone-lab
 */

export type TritoneScaleName = 'WHITE' | 'BLUE' | 'RED' | 'TONES' | 'BLACK';

export type NotePair = readonly [number, number];
export type TritonePair = NotePair;

export interface TritoneScale {
    readonly name: TritoneScaleName;
    readonly notes: readonly number[];
    readonly tritones: readonly TritonePair[];
}

/** Which note of a semitone survives: the lower or the upper one. */
export type SemitoneSide = 'LOW' | 'HIGH';

/** One side per semitone, in ascending semitone order. */
export type SemitoneSelection = readonly SemitoneSide[];

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

export interface SemitoneView {
    readonly name: TritoneScaleName;
    readonly selection: SemitoneSelection;
    /** Notes removed from the parent scale. */
    readonly hiddenNotes: readonly number[];
    /** Visible notes in ascending order. Their index is the new visible degree. */
    readonly notes: readonly number[];
    /** Semitones left in the visible scale; empty for every MVP view. */
    readonly semitones: readonly NotePair[];
    /** Tritones that survive in the visible scale. */
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

/**
 * Adjacent pitch classes a semitone apart, as `[lower, upper]`.
 *
 * The MVP only uses WHITE and BLUE, whose semitones never wrap around 11..0,
 * so the simple ascending scan is enough.
 */
function findSemitones(notes: readonly number[]): NotePair[] {
    const pairs: NotePair[] = [];

    for (let index = 0; index < notes.length - 1; index += 1) {
        const note = notes[index];
        const next = notes[index + 1];
        if (next - note === 1) {
            pairs.push([note, next]);
        }
    }

    return pairs;
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
 * Collapse the semitones that touch a tritone into pentatonic views.
 *
 * Hiding no longer removes one endpoint of the tritone: from each semitone,
 * exactly one note survives (`LOW` keeps the lower note, `HIGH` keeps the
 * upper one). The visible scale therefore has no semitones. WHITE and BLUE
 * have two semitones each, so there are four views.
 *
 * The MVP only supports WHITE and BLUE. A tritone can survive a view when both
 * of its notes are kept; `tritones` reports the remaining ones.
 */
export function hideSemitones(
    name: TritoneScaleName,
    selection: SemitoneSelection
): SemitoneView {
    if (name !== 'WHITE' && name !== 'BLUE') {
        throw new RangeError(`${name} does not support semitone views in the MVP`);
    }

    const scale = TRITONE_SCALES[name];
    const semitones = findSemitones(scale.notes);
    if (selection.length !== semitones.length) {
        throw new RangeError(
            `${name} needs ${semitones.length} semitone choices, got ${selection.length}`
        );
    }

    const hiddenNotes: number[] = [];
    semitones.forEach(([low, high], index) => {
        hiddenNotes.push(selection[index] === 'LOW' ? high : low);
    });
    const hidden = new Set(hiddenNotes);

    const notes = scale.notes.filter(note => !hidden.has(note));
    return {
        name,
        selection,
        hiddenNotes: [...hiddenNotes].sort((left, right) => left - right),
        notes,
        semitones: findSemitones(notes),
        tritones: findTritones(notes)
    };
}

/**
 * The four MVP views, in the order both-up, both-down, down/up and up/down.
 * `HIGH` keeps the upper note of a semitone; `LOW` keeps the lower one.
 */
export const SEMITONE_VIEW_SELECTIONS: readonly SemitoneSelection[] = [
    ['HIGH', 'HIGH'],
    ['LOW', 'LOW'],
    ['LOW', 'HIGH'],
    ['HIGH', 'LOW']
];

/** Small human-readable report for the lab. */
export function formatSemitoneView(view: SemitoneView): string {
    return [
        `${view.name} ${view.selection.join('/')}`,
        `hide={${view.hiddenNotes.join(',')}}`,
        `visible={${view.notes.join(',')}}`,
        `semitones=${formatPairs(view.semitones)}`,
        `tritones=${formatPairs(view.tritones)}`
    ].join(' ');
}

function formatPairs(items: readonly NotePair[]): string {
    return items.length === 0 ? '∅' : items.map(([start, end]) => `(${start},${end})`).join(' ');
}

/** Small human-readable report for the lab. */
export function formatModulation(result: ModulationResult): string {
    return [
        `${result.source} -> ${result.target} (${result.fromOrdinal}->${result.toOrdinal})`,
        `key=${result.key}`,
        `fixed=${formatPairs(result.fixed)}`,
        `added=${formatPairs(result.added)}`,
        `removed=${formatPairs(result.removed)}`
    ].join(' | ');
}
