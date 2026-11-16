import {
    formatModulation,
    hideTritones,
    modulate,
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

    it('hides the only WHITE tritone and reindexes the visible scale', () => {
        const result = hideTritones('WHITE', 'LOW');

        expect(result.notes).toEqual([0, 2, 5, 7, 10]);
        expect(result.notes).toHaveLength(5);
        expect(result.tritones).toEqual([]);
    });

    it('hides one BLUE tritone and leaves the other', () => {
        const low = hideTritones('BLUE', 'LOW');
        const high = hideTritones('BLUE', 'HIGH');

        expect(low.notes).toEqual([0, 4, 5, 7, 10]);
        expect(low.tritones).toEqual([[4, 10]]);
        expect(high.notes).toEqual([0, 2, 5, 7, 8]);
        expect(high.tritones).toEqual([[2, 8]]);
    });

    it('can hide all BLUE tritones', () => {
        const result = hideTritones('BLUE', 'ALL');

        expect(result.notes).toEqual([0, 5, 7]);
        expect(result.notes).toHaveLength(3);
        expect(result.tritones).toEqual([]);
    });
});
