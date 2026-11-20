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
 *   semitone survives, grouped by tritone. WHITE, BLUE, RED and BLACK expose
 *   four views; TONES has no semitones and is the identity.
 *
 * The pure collapse model lives in `../scale-view` (ADR-006); this lab adapts
 * it to the tritone-reporting shape used by the prototype.
 *
 * Run its tests with:
 *
 *   npm test -- tritone-lab
 */

import {
    collapseView,
    CollapseMode,
    NotePair,
    SemitoneSide,
    semitonesOf,
    tritonesOf
} from '../scale-view';

export type TritoneScaleName = 'WHITE' | 'BLUE' | 'RED' | 'TONES' | 'BLACK';

export type TritonePair = NotePair;

export interface TritoneScale {
    readonly name: TritoneScaleName;
    readonly notes: readonly number[];
    readonly tritones: readonly TritonePair[];
}

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

function buildScale(name: TritoneScaleName): TritoneScale {
    const notes = SCALE_NOTES[name];
    return { name, notes, tritones: tritonesOf(notes) };
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

const MODE_BY_SELECTION: Readonly<Record<string, CollapseMode>> = {
    'HIGH/HIGH': 'BOTH_HIGH',
    'LOW/LOW': 'BOTH_LOW',
    'LOW/HIGH': 'LOW_HIGH',
    'HIGH/LOW': 'HIGH_LOW'
};

/**
 * Collapse the semitones that touch a tritone into pentatonic views.
 *
 * Hiding no longer removes one endpoint of the tritone: from each semitone,
 * exactly one note survives (`LOW` keeps the lower note, `HIGH` keeps the
 * upper one). The visible scale therefore has no semitones. WHITE and BLUE
 * have two semitones each, so there are four views.
 *
 * The family supports WHITE, BLUE, RED and BLACK. TONES has no semitones, so
 * every mode is the identity. A tritone can survive a view when both of its
 * notes are kept; `tritones` reports the remaining ones.
 */
export function hideSemitones(
    name: TritoneScaleName,
    selection: SemitoneSelection
): SemitoneView {
    if (selection.length !== 2) {
        throw new RangeError(`${name} needs 2 side choices, got ${selection.length}`);
    }

    const scale = TRITONE_SCALES[name];
    const mode = MODE_BY_SELECTION[selection.join('/')];
    if (!mode) {
        throw new RangeError(`unsupported semitone selection ${selection.join('/')}`);
    }

    const view = collapseView(scale.notes, mode);
    return {
        name,
        selection,
        hiddenNotes: view.hiddenNotes,
        notes: view.notes,
        semitones: view.semitones,
        tritones: view.tritones
    };
}

/**
 * The four views, in the order both-up, both-down, down/up and up/down.
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
