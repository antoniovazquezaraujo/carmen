import {
    canApplyCollapse,
    collapseGroups,
    collapseView,
    COLLAPSE_MODE_NAMES,
    COLLAPSE_MODES,
    isCollapseMode,
    semitonesOf,
    tritonesOf
} from '../scale-view';

const WHITE = [0, 2, 3, 5, 7, 9, 10];
const BLUE = [0, 2, 4, 5, 7, 8, 10];
const RED = [0, 1, 4, 5, 7, 8, 11];
const TONES = [0, 2, 4, 6, 8, 10];
const BLACK = [1, 2, 4, 5, 7, 8, 10, 11];
const FULL = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

describe('scale views', () => {
    it('returns the parent for COLLAPSE NONE', () => {
        const view = collapseView(WHITE, 'NONE');

        expect(view.notes).toEqual(WHITE);
        expect(view.hiddenNotes).toEqual([]);
        expect(view.groups).toEqual([]);
        expect(view.semitones).toEqual([
            [2, 3],
            [9, 10]
        ]);
        expect(view.tritones).toEqual([[3, 9]]);
    });

    it('derives the four WHITE collapse views', () => {
        const views = COLLAPSE_MODES.map(mode => collapseView(WHITE, mode));

        expect(views.map(view => view.mode)).toEqual([
            'BOTH_HIGH',
            'BOTH_LOW',
            'LOW_HIGH',
            'HIGH_LOW'
        ]);
        expect(views.map(view => view.hiddenNotes)).toEqual([
            [2, 9],
            [3, 10],
            [3, 9],
            [2, 10]
        ]);
        expect(views.map(view => view.notes)).toEqual([
            [0, 3, 5, 7, 10],
            [0, 2, 5, 7, 9],
            [0, 2, 5, 7, 10],
            [0, 3, 5, 7, 9]
        ]);
        expect(views.map(view => view.semitones)).toEqual([[], [], [], []]);
        expect(views.map(view => view.tritones)).toEqual([[], [], [], [[3, 9]]]);
    });

    it('derives the four BLUE collapse views', () => {
        const views = COLLAPSE_MODES.map(mode => collapseView(BLUE, mode));

        expect(views.map(view => view.hiddenNotes)).toEqual([
            [4, 7],
            [5, 8],
            [5, 7],
            [4, 8]
        ]);
        expect(views.map(view => view.notes)).toEqual([
            [0, 2, 5, 8, 10],
            [0, 2, 4, 7, 10],
            [0, 2, 4, 8, 10],
            [0, 2, 5, 7, 10]
        ]);
        expect(views.map(view => view.semitones)).toEqual([[], [], [], []]);
        expect(views.map(view => view.tritones)).toEqual([
            [[2, 8]],
            [[4, 10]],
            [
                [2, 8],
                [4, 10]
            ],
            []
        ]);
    });

    it('groups RED by tritone and keeps both endpoints of each tritone together', () => {
        expect(collapseGroups(RED)).toEqual([
            [
                [0, 1],
                [7, 8]
            ],
            [
                [4, 5],
                [11, 0]
            ]
        ]);

        const views = COLLAPSE_MODES.map(mode => collapseView(RED, mode));

        expect(views.map(view => view.notes)).toEqual([
            [0, 1, 5, 8],
            [0, 4, 7, 11],
            [0, 5, 7],
            [1, 4, 8, 11]
        ]);
        expect(views.map(view => view.hiddenNotes)).toEqual([
            [4, 7, 11],
            [1, 5, 8],
            [1, 4, 8, 11],
            [0, 5, 7]
        ]);
        expect(views.map(view => view.semitones)).toEqual([[[0, 1]], [[11, 0]], [], []]);
    });

    it('groups BLACK by the tritones that share the same semitones', () => {
        expect(collapseGroups(BLACK)).toEqual([
            [
                [1, 2],
                [7, 8]
            ],
            [
                [4, 5],
                [10, 11]
            ]
        ]);

        const views = COLLAPSE_MODES.map(mode => collapseView(BLACK, mode));

        expect(views.map(view => view.notes)).toEqual([
            [2, 5, 8, 11],
            [1, 4, 7, 10],
            [1, 5, 7, 11],
            [2, 4, 8, 10]
        ]);
        expect(views.map(view => view.semitones)).toEqual([[], [], [], []]);
    });

    it('treats TONES as the identity for every collapse mode', () => {
        for (const mode of COLLAPSE_MODES) {
            const view = collapseView(TONES, mode);
            expect(view.notes).toEqual(TONES);
            expect(view.hiddenNotes).toEqual([]);
            expect(view.groups).toEqual([]);
        }
    });

    it('defines views on relative notes and applies KEY afterwards', () => {
        const view = collapseView(WHITE, 'LOW_HIGH');
        const key = 8;
        const transposedView = view.notes.map(note => (note + key) % 12).sort((left, right) => left - right);

        expect(transposedView).toEqual([1, 3, 6, 8, 10]);

        const transposedParent = WHITE.map(note => (note + key) % 12).sort((left, right) => left - right);
        const viewAfterKey = collapseView(transposedParent, 'LOW_HIGH');

        expect(viewAfterKey.notes).not.toEqual(transposedView);
        expect(viewAfterKey.notes).toEqual([1, 3, 5, 8, 11]);
    });

    it('rejects FULL and accepts the supported parents', () => {
        expect(canApplyCollapse(WHITE, 'BOTH_HIGH')).toBe(true);
        expect(canApplyCollapse(BLUE, 'BOTH_HIGH')).toBe(true);
        expect(canApplyCollapse(RED, 'BOTH_HIGH')).toBe(true);
        expect(canApplyCollapse(BLACK, 'BOTH_HIGH')).toBe(true);
        expect(canApplyCollapse(TONES, 'BOTH_HIGH')).toBe(true);
        expect(canApplyCollapse(FULL, 'BOTH_HIGH')).toBe(false);
        expect(() => collapseView(FULL, 'BOTH_HIGH')).toThrow(RangeError);
    });

    it('validates collapse mode names', () => {
        expect(COLLAPSE_MODE_NAMES).toEqual([...COLLAPSE_MODES, 'NONE']);
        expect(isCollapseMode('BOTH_HIGH')).toBe(true);
        expect(isCollapseMode('NONE')).toBe(true);
        expect(isCollapseMode('MIXED')).toBe(false);
    });

    it('finds cyclic semitones and tritones in relative scales', () => {
        expect(semitonesOf(WHITE)).toEqual([
            [2, 3],
            [9, 10]
        ]);
        expect(semitonesOf(RED)).toEqual([
            [0, 1],
            [4, 5],
            [7, 8],
            [11, 0]
        ]);
        expect(semitonesOf(BLACK)).toEqual([
            [1, 2],
            [4, 5],
            [7, 8],
            [10, 11]
        ]);
        expect(semitonesOf(TONES)).toEqual([]);
        expect(tritonesOf(WHITE)).toEqual([[3, 9]]);
    });
});
