import {
    formatModulation,
    formatSemitoneView,
    hideSemitones,
    modulate,
    SEMITONE_VIEW_SELECTIONS,
    TRITONE_SCALES,
    tritoneStarts
} from '../tritone-lab';

describe('tritone lab', () => {
    it('exposes the tritone pairs of the full scales', () => {
        expect(TRITONE_SCALES.WHITE.tritones).toEqual([[3, 9]]);
        expect(TRITONE_SCALES.BLUE.tritones).toEqual([
            [2, 8],
            [4, 10]
        ]);
        expect(TRITONE_SCALES.RED.tritones).toEqual([
            [1, 7],
            [5, 11]
        ]);
        expect(TRITONE_SCALES.TONES.tritones).toEqual([
            [0, 6],
            [2, 8],
            [4, 10]
        ]);
        expect(TRITONE_SCALES.BLACK.tritones).toEqual([
            [1, 7],
            [2, 8],
            [4, 10],
            [5, 11]
        ]);
    });

    it('reduces a tritone to its start note', () => {
        expect(tritoneStarts('WHITE')).toEqual([3]);
        expect(tritoneStarts('BLUE')).toEqual([2, 4]);
        expect(tritoneStarts('TONES')).toEqual([0, 2, 4]);
        expect(tritoneStarts('BLACK')).toEqual([1, 2, 4, 5]);
    });

    it('anchors WHITE to BLUE and derives the exact key', () => {
        const result = modulate('WHITE', 'BLUE', 1, 2);

        expect(result.key).toBe(11);
        expect(result.targetTritones).toEqual([
            [1, 7],
            [3, 9]
        ]);
        expect(result.fixed).toEqual([[3, 9]]);
        expect(result.added).toEqual([[1, 7]]);
        expect(result.removed).toEqual([]);
        expect(formatModulation(result)).toContain('WHITE -> BLUE (1->2)');
    });

    it('rejects ordinals outside the available tritones', () => {
        expect(() => modulate('WHITE', 'BLUE', 2, 1)).toThrow(RangeError);
        expect(() => modulate('WHITE', 'BLUE', 1, 3)).toThrow(RangeError);
    });

    it('derives the four WHITE semitone views', () => {
        const views = SEMITONE_VIEW_SELECTIONS.map(selection => hideSemitones('WHITE', selection));

        expect(new Set(SEMITONE_VIEW_SELECTIONS.map(selection => selection.join('/'))).size).toBe(4);
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

    it('derives the four BLUE semitone views', () => {
        const views = SEMITONE_VIEW_SELECTIONS.map(selection => hideSemitones('BLUE', selection));

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

    it('rejects semitone views outside the WHITE/BLUE MVP', () => {
        expect(() => hideSemitones('RED', ['LOW', 'LOW'])).toThrow(RangeError);
        expect(() => hideSemitones('TONES', [])).toThrow(RangeError);
    });

    it('rejects selections with the wrong number of semitone choices', () => {
        expect(() => hideSemitones('WHITE', ['LOW'])).toThrow(RangeError);
        expect(() => hideSemitones('BLUE', ['LOW', 'HIGH', 'LOW'])).toThrow(RangeError);
    });

    it('formats a semitone view', () => {
        const view = hideSemitones('WHITE', ['HIGH', 'HIGH']);
        const report = formatSemitoneView(view);

        expect(report).toContain('WHITE HIGH/HIGH');
        expect(report).toContain('hide={2,9}');
        expect(report).toContain('visible={0,3,5,7,10}');
        expect(report).toContain('semitones=∅');
    });
});
