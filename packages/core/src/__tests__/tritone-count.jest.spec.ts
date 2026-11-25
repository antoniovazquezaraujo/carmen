import {
  findTritoneCountModulation,
  formatCandidate,
  invertTritone,
  orderedNotes,
  orderedTritones
} from '../tritone-count';

describe('tritone-count lab', () => {
  it('orders notes from the key upwards', () => {
    expect(orderedNotes('WHITE', 2)).toEqual([2, 4, 5, 7, 9, 11, 0]);
    expect(orderedNotes('BLUE', 7)).toEqual([7, 9, 11, 0, 2, 3, 5]);
  });

  it('keeps tritone orientation by scale order', () => {
    expect(orderedTritones('WHITE', 2)).toEqual([[5, 11]]);
    expect(orderedTritones('BLUE', 7)).toEqual([
      [9, 3],
      [11, 5]
    ]);
    expect(orderedTritones('BLUE', 9)).toEqual([
      [11, 5],
      [1, 7]
    ]);
    expect(orderedTritones('RED', 4)).toEqual([
      [5, 11],
      [9, 3]
    ]);
  });

  it('adds a tritone keeping the old one in first position', () => {
    const result = findTritoneCountModulation('WHITE', 2, 1, 1);

    expect(result.reason).toBe('OK');
    expect(result.best?.scale).toBe('RED');
    expect(result.best?.key).toBe(4);
    expect(result.best?.preserved).toEqual([[5, 11]]);
    expect(result.best?.keptSourcePosition).toBe(1);
    expect(result.best?.keptTargetPosition).toBe(1);
    expect(result.best?.outNotes).toEqual([2, 7]);
    expect(result.best?.inNotes).toEqual([8, 3]);
    expect(result.best?.changedNotes).toBe(4);
  });

  it('adds a tritone keeping the old one in second position', () => {
    const result = findTritoneCountModulation('WHITE', 2, 1, 2);

    expect(result.reason).toBe('OK');
    expect(result.best?.scale).toBe('GREEN');
    expect(result.best?.key).toBe(2);
    expect(result.best?.preserved).toEqual([[5, 11]]);
    expect(result.best?.keptSourcePosition).toBe(1);
    expect(result.best?.keptTargetPosition).toBe(2);
    expect(result.best?.outNotes).toEqual([7]);
    expect(result.best?.inNotes).toEqual([8]);
    expect(result.best?.changedNotes).toBe(2);
  });

  it('rejects removing the last tritone from WHITE', () => {
    const result = findTritoneCountModulation('WHITE', 2, -1, 1);

    expect(result.reason).toBe('NO_TARGET_COUNT');
    expect(result.best).toBeNull();
  });

  it('removes a tritone from BLUE keeping the first source tritone', () => {
    const result = findTritoneCountModulation('BLUE', 7, -1, 1);

    expect(result.reason).toBe('OK');
    expect(result.best?.scale).toBe('WHITE');
    expect(result.best?.key).toBe(6);
    expect(result.best?.preserved).toEqual([[9, 3]]);
    expect(result.best?.keptSourcePosition).toBe(1);
    expect(result.best?.keptTargetPosition).toBe(1);
    expect(result.best?.changedNotes).toBe(8);
  });

  it('removes a tritone from BLUE keeping the second source tritone', () => {
    const result = findTritoneCountModulation('BLUE', 7, -1, 2);

    expect(result.reason).toBe('OK');
    expect(result.best?.scale).toBe('WHITE');
    expect(result.best?.key).toBe(8);
    expect(result.best?.preserved).toEqual([[11, 5]]);
    expect(result.best?.keptSourcePosition).toBe(2);
    expect(result.best?.keptTargetPosition).toBe(1);
    expect(result.best?.changedNotes).toBe(8);
  });

  it('has no parent-scale target for five tritones', () => {
    expect(findTritoneCountModulation('BLACK', 0, 1).reason).toBe(
      'NO_TARGET_COUNT'
    );
    expect(findTritoneCountModulation('FULL', 0, -1).reason).toBe(
      'NO_TARGET_COUNT'
    );
  });

  it('marks TONES to BLACK as a swap, not a clean addition', () => {
    const result = findTritoneCountModulation('TONES', 1, 1);

    expect(result.reason).toBe('OK');
    expect(result.best?.scale).toBe('BLACK');
    expect(result.best?.preserved).toHaveLength(2);
    expect(result.best?.preservesAll).toBe(false);
    expect(result.best?.isClean).toBe(false);
  });

  it('marks BLACK to TONES as a swap, not a clean removal', () => {
    const result = findTritoneCountModulation('BLACK', 0, -1);

    expect(result.reason).toBe('OK');
    expect(result.best?.scale).toBe('TONES');
    expect(result.best?.preserved).toHaveLength(2);
    expect(result.best?.isClean).toBe(false);
  });

  it('rejects an out-of-range keep position', () => {
    expect(findTritoneCountModulation('WHITE', 2, 1, 3).reason).toBe(
      'KEEP_POSITION_OUT_OF_RANGE'
    );
    expect(findTritoneCountModulation('WHITE', 2, 1, 0).reason).toBe(
      'KEEP_POSITION_OUT_OF_RANGE'
    );
  });

  it('rejects a zero delta', () => {
    expect(findTritoneCountModulation('WHITE', 2, 0).reason).toBe(
      'INVALID_DELTA'
    );
  });

  it('inverts a tritone with KEY + 6', () => {
    const white = invertTritone('WHITE', 2);
    const blue = invertTritone('BLUE', 7);

    expect(white.key).toBe(8);
    expect(white.tritones).toEqual([[11, 5]]);
    expect(blue.key).toBe(1);
    expect(blue.tritones).toEqual([
      [3, 9],
      [5, 11]
    ]);
  });

  it('formats a candidate with notes out and in', () => {
    const result = findTritoneCountModulation('WHITE', 2, 1, 1);
    const report = formatCandidate(result.best!);

    expect(report).toContain('RED key=4');
    expect(report).toContain('preserved=F-B');
    expect(report).toContain('out={2,7}');
    expect(report).toContain('in={8,3}');
    expect(report).toContain('clean');
  });
});
