/**
 * Scale views: pure projections of a parent scale (ADR-006).
 *
 * The first family is `SEMITONE_COLLAPSE`: each semitone that touches a
 * tritone keeps a single note. WHITE and BLUE have exactly two semitones, so
 * they expose four views; `NONE` is the identity view.
 *
 * A view is defined on the parent's relative notes (root 0) and applied before
 * `KEY`. Passing an already transposed scale is not supported: its semitones
 * may wrap around 11..0 and the simple ascending scan would miss one.
 */

export type NotePair = readonly [number, number];

export const COLLAPSE_MODES = ['BOTH_HIGH', 'BOTH_LOW', 'LOW_HIGH', 'HIGH_LOW'] as const;
export type CollapseMode = (typeof COLLAPSE_MODES)[number] | 'NONE';

export const COLLAPSE_MODE_NAMES: readonly CollapseMode[] = [...COLLAPSE_MODES, 'NONE'];

export type SemitoneSide = 'LOW' | 'HIGH';

export interface ScaleView {
    readonly family: 'SEMITONE_COLLAPSE';
    readonly mode: CollapseMode;
    /** Visible notes in ascending order. Their index is the new visible degree. */
    readonly notes: readonly number[];
    /** Notes removed from the parent scale. */
    readonly hiddenNotes: readonly number[];
    /** Semitones left in the visible scale; empty for the non-identity views. */
    readonly semitones: readonly NotePair[];
    /** Tritones that survive in the visible scale. */
    readonly tritones: readonly NotePair[];
}

const MODE_SIDES: Readonly<Record<Exclude<CollapseMode, 'NONE'>, readonly [SemitoneSide, SemitoneSide]>> = {
    BOTH_HIGH: ['HIGH', 'HIGH'],
    BOTH_LOW: ['LOW', 'LOW'],
    LOW_HIGH: ['LOW', 'HIGH'],
    HIGH_LOW: ['HIGH', 'LOW']
};

export function isCollapseMode(value: string): value is CollapseMode {
    return COLLAPSE_MODE_NAMES.includes(value as CollapseMode);
}

/**
 * Adjacent pitch classes a semitone apart, as `[lower, upper]`.
 *
 * Only valid for relative scales that do not wrap around 11..0; the current
 * MVP parents (WHITE and BLUE) satisfy that.
 */
export function semitonesOf(notes: readonly number[]): NotePair[] {
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

export function tritonesOf(notes: readonly number[]): NotePair[] {
    const noteSet = new Set(notes);
    const pairs: NotePair[] = [];

    for (const start of notes) {
        const end = (start + 6) % 12;
        if (noteSet.has(end) && start < end) {
            pairs.push([start, end]);
        }
    }

    return pairs.sort((left, right) => left[0] - right[0] || left[1] - right[1]);
}

/**
 * Project a parent scale into a collapse view.
 *
 * `NONE` returns the parent unchanged. The other modes require exactly two
 * semitones and keep the lower or upper note of each one. `hiddenNotes` are
 * the notes removed from the visible scale.
 */
export function collapseView(parentNotes: readonly number[], mode: CollapseMode): ScaleView {
    const parent = [...parentNotes].sort((left, right) => left - right);

    if (mode === 'NONE') {
        return {
            family: 'SEMITONE_COLLAPSE',
            mode,
            notes: parent,
            hiddenNotes: [],
            semitones: semitonesOf(parent),
            tritones: tritonesOf(parent)
        };
    }

    const semitones = semitonesOf(parent);
    const sides = MODE_SIDES[mode];
    if (semitones.length !== sides.length) {
        throw new RangeError(
            `COLLAPSE ${mode} requires a parent with exactly ${sides.length} semitones; got ${semitones.length}`
        );
    }

    const hiddenNotes = semitones.map(([low, high], index) => (sides[index] === 'LOW' ? high : low));
    const hidden = new Set(hiddenNotes);
    const notes = parent.filter(note => !hidden.has(note));

    return {
        family: 'SEMITONE_COLLAPSE',
        mode,
        notes,
        hiddenNotes: [...hiddenNotes].sort((left, right) => left - right),
        semitones: semitonesOf(notes),
        tritones: tritonesOf(notes)
    };
}
