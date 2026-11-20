/**
 * Scale views: pure projections of a parent scale (ADR-006).
 *
 * The first family is `SEMITONE_COLLAPSE`. It groups the semitone intervals
 * around tritones into two groups and lets the user choose the low or high
 * note of every semitone in each group. WHITE, BLUE, RED and BLACK expose four
 * views (two groups, two sides per group); TONES has no semitones, so every
 * collapse mode is the identity.
 *
 * A view is defined on the parent's relative notes (root 0) and applied before
 * `KEY`.
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
    /** Semitones left in the visible scale (may be empty). */
    readonly semitones: readonly NotePair[];
    /** Tritones that survive in the visible scale. */
    readonly tritones: readonly NotePair[];
    /** Semitone intervals grouped by tritone; two groups for the supported scales. */
    readonly groups: readonly (readonly NotePair[])[];
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

/** `true` when the collapse family can project this parent (identity included). */
export function canApplyCollapse(parentNotes: readonly number[], mode: CollapseMode): boolean {
    if (mode === 'NONE') {
        return true;
    }
    const groups = collapseGroups(parentNotes);
    // TONES and FULL have no supported groups for now: every mode is a no-op.
    return groups.length === 0 || groups.length === 2;
}

/**
 * Semitone intervals of a relative scale, in ascending order of their start.
 *
 * Pairs are `[start, end]`; for the wrap `11..0` the pair is `[11, 0]`.
 * `LOW` always selects the start note and `HIGH` the end note.
 */
export function semitonesOf(notes: readonly number[]): NotePair[] {
    const sorted = [...notes].sort((left, right) => left - right);
    const pairs: NotePair[] = [];

    for (let index = 0; index < sorted.length; index += 1) {
        const low = sorted[index];
        const high = sorted[(index + 1) % sorted.length];
        const delta = index === sorted.length - 1 ? high + 12 - low : high - low;
        if (sorted.length > 1 && delta === 1) {
            pairs.push([low, high]);
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

function intervalKey([low, high]: NotePair): string {
    return `${low}:${high}`;
}

/** Semitone intervals touched by each tritone, in ascending interval order. */
function tritoneSemitones(notes: readonly number[]): NotePair[][] {
    const semitones = semitonesOf(notes);

    return tritonesOf(notes)
        .map(tritone => {
            const [start, end] = tritone;
            return semitones.filter(([low, high]) =>
                low === start || low === end || high === start || high === end
            );
        })
        .filter(group => group.length > 0);
}

function uniqueSemitoneSets(groups: readonly NotePair[][]): NotePair[][] {
    const seen = new Set<string>();
    const unique: NotePair[][] = [];

    for (const group of groups) {
        const key = group.map(intervalKey).sort().join('|');
        if (!seen.has(key)) {
            seen.add(key);
            unique.push(group);
        }
    }

    return unique;
}

function groupMinStart(group: readonly NotePair[]): number {
    return Math.min(...group.map(([start]) => start));
}

/**
 * Build the two collapse groups for a parent scale.
 *
 * - WHITE (one tritone, two semitone endpoints): each endpoint is a group.
 * - BLUE/RED (two tritones): each tritone is a group.
 * - BLACK (four tritones): pair tritones that share the same two semitones.
 * - TONES (no semitones): no groups (identity).
 * - FULL/other structures: not supported.
 */
export function collapseGroups(notes: readonly number[]): NotePair[][] {
    if (semitonesOf(notes).length === 0) {
        return [];
    }

    const sets = uniqueSemitoneSets(tritoneSemitones(notes));

    if (sets.length === 2) {
        return sets
            .map(group => [...group].sort((left, right) => left[0] - right[0] || left[1] - right[1]))
            .sort((left, right) => groupMinStart(left) - groupMinStart(right));
    }

    if (sets.length === 1 && sets[0].length === 2) {
        return [...sets[0]]
            .sort((left, right) => left[0] - right[0] || left[1] - right[1])
            .map(interval => [interval]);
    }

    return [];
}

/**
 * Project a parent scale into a collapse view.
 *
 * `NONE` returns the parent unchanged. The other modes require two groups of
 * semitone intervals; every interval in a group keeps the same side. The
 * visible notes are the union of the selected notes plus parent notes that are
 * not part of any semitone. TONES and FULL have no supported groups for now,
 * so every mode is a no-op; FULL's rule is still pending.
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
            tritones: tritonesOf(parent),
            groups: []
        };
    }

    const groups = collapseGroups(parent);

    if (groups.length === 0) {
        return {
            family: 'SEMITONE_COLLAPSE',
            mode,
            notes: parent,
            hiddenNotes: [],
            semitones: semitonesOf(parent),
            tritones: tritonesOf(parent),
            groups: []
        };
    }

    const semitones = semitonesOf(parent);

    if (groups.length !== 2) {
        throw new RangeError(`COLLAPSE ${mode} needs exactly two groups; got ${groups.length}`);
    }

    const sides = MODE_SIDES[mode];
    const selected = new Set<number>();
    groups.forEach((group, index) => {
        const side = sides[index];
        group.forEach(([low, high]) => {
            selected.add(side === 'LOW' ? low : high);
        });
    });

    const semitoneNotes = new Set(semitones.flatMap(([low, high]) => [low, high]));
    const notes = parent.filter(note => selected.has(note) || !semitoneNotes.has(note));
    const hiddenNotes = parent.filter(note => !notes.includes(note));

    return {
        family: 'SEMITONE_COLLAPSE',
        mode,
        notes,
        hiddenNotes,
        semitones: semitonesOf(notes),
        tritones: tritonesOf(notes),
        groups
    };
}
