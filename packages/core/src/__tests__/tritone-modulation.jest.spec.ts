import { ScaleTypes } from '../scale';
import { modulate } from '../tritone-modulation';

describe('tritone modulation', () => {
    it('anchors WHITE to BLUE and derives the exact key', () => {
        const result = modulate(ScaleTypes.WHITE, ScaleTypes.BLUE, 1, 2);

        expect(result.key).toBe(11);
        expect(result.targetTritones).toEqual([
            [1, 7],
            [3, 9]
        ]);
        expect(result.fixed).toEqual([[3, 9]]);
        expect(result.added).toEqual([[1, 7]]);
        expect(result.removed).toEqual([]);
    });

    it('anchors BLUE to WHITE', () => {
        const result = modulate(ScaleTypes.BLUE, ScaleTypes.WHITE, 1, 1);

        expect(result.key).toBe(11);
        expect(result.fixed).toEqual([[2, 8]]);
        expect(result.added).toEqual([]);
        expect(result.removed).toEqual([[4, 10]]);
    });

    it('takes the current source key into account', () => {
        const result = modulate(ScaleTypes.WHITE, ScaleTypes.BLUE, 1, 1, 5);

        expect(result.key).toBe(6);
        expect(result.fixed).toEqual([[2, 8]]);
        expect(result.added).toEqual([[4, 10]]);
        expect(result.removed).toEqual([]);
    });

    it('rejects ordinals outside the available tritones', () => {
        expect(() => modulate(ScaleTypes.WHITE, ScaleTypes.BLUE, 2, 1)).toThrow(RangeError);
        expect(() => modulate(ScaleTypes.WHITE, ScaleTypes.BLUE, 1, 3)).toThrow(RangeError);
    });

    it('works with TONES and FULL tritone sets', () => {
        const tones = modulate(ScaleTypes.TONES, ScaleTypes.WHITE, 1, 1);
        expect(tones.key).toBe(9);

        const full = modulate(ScaleTypes.FULL, ScaleTypes.WHITE, 1, 1);
        expect(full.key).toBe(9);
    });
});
