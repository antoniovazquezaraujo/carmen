import {
    collapseView,
    COLLAPSE_MODE_NAMES,
    COLLAPSE_MODES,
    isCollapseMode,
    semitonesOf,
    tritonesOf
} from '../scale-view';

const WHITE = [0, 2, 3, 5, 7, 9, 10];
const BLUE = [0, 2, 4, 5, 7, 8, 10];

describe('scale views', () => {
    it('returns the parent for COLLAPSE NONE', () => {
        const view = collapseView(WHITE, 'NONE');

        expect(view.notes).toEqual(WHITE);
        expect(view.hiddenNotes).toEqual([]);
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

    it('defines views on relative notes and applies KEY afterwards', () => {
        const view = collapseView(WHITE, 'LOW_HIGH');
        const transposed = view.notes.map(note => (note + 2) % 12).sort((left, right) => left - right);

        expect(transposed).toEqual([0, 2, 4, 7, 9]);

        const transposedParent = WHITE.map(note => (note + 2) % 12).sort((left, right) => left - right);
        expect(() => collapseView(transposedParent, 'LOW_HIGH')).toThrow(RangeError);
    });

    it('rejects parents that do not have two semitones', () => {
        expect(() => collapseView([0, 1, 4, 5, 7, 8, 11], 'BOTH_HIGH')).toThrow(RangeError);
        expect(() => collapseView([0, 2, 4, 6, 8, 10], 'BOTH_HIGH')).toThrow(RangeError);
    });

    it('validates collapse mode names', () => {
        expect(COLLAPSE_MODE_NAMES).toEqual([...COLLAPSE_MODES, 'NONE']);
        expect(isCollapseMode('BOTH_HIGH')).toBe(true);
        expect(isCollapseMode('NONE')).toBe(true);
        expect(isCollapseMode('MIXED')).toBe(false);
    });

    it('finds semitones and tritones in relative scales', () => {
        expect(semitonesOf(WHITE)).toEqual([
            [2, 3],
            [9, 10]
        ]);
        expect(tritonesOf(WHITE)).toEqual([[3, 9]]);
    });
});
