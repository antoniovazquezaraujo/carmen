import { Scale, ScaleTypes } from './scale';
import { NotePair } from './scale-view';

/**
 * Experimental tritone-count modulation (not wired into `.mr` yet).
 *
 * The model keeps tritones **oriented by their first appearance in the
 * scale**. `F-B` and `B-F` are therefore different objects: the second one is
 * the inversion of the first. A modulation only preserves a tritone when the
 * orientation is kept; `INVERT TRITONE` is a separate `KEY + 6` operation.
 *
 * The search follows the rules agreed for the lab:
 *
 * 1. target tritone count = source count + delta;
 * 2. keep the tritone at the requested position (target position when adding,
 *    source position when removing);
 * 3. maximise the number of preserved oriented tritones;
 * 4. minimise the notes that leave and enter;
 * 5. resolve any remaining tie deterministically (closest key, scale order,
 *    key).
 */

export const TRITONE_COUNT_SCALE_NAMES = [
  'WHITE',
  'BLUE',
  'RED',
  'TONES',
  'BLACK',
  'FULL',
  'GREEN',
  'PINK'
] as const;

export type TritoneCountScaleName = (typeof TRITONE_COUNT_SCALE_NAMES)[number];

export interface TritoneCountCandidate {
  readonly scale: TritoneCountScaleName;
  readonly key: number;
  /** Actual pitch classes, in scale order starting from the key. */
  readonly notes: readonly number[];
  /** Tritones oriented by their first appearance in scale order. */
  readonly tritones: readonly NotePair[];
  /** Source tritones that survive with the same orientation. */
  readonly preserved: readonly NotePair[];
  readonly added: readonly NotePair[];
  readonly removed: readonly NotePair[];
  readonly outNotes: readonly number[];
  readonly inNotes: readonly number[];
  readonly sharedNotes: number;
  readonly changedNotes: number;
  readonly keptPair: NotePair | null;
  readonly keptSourcePosition: number | null;
  readonly keptTargetPosition: number | null;
  /** `true` when every source tritone survives. */
  readonly preservesAll: boolean;
  /** `true` for a clean add (all kept) or a clean remove (exactly one lost). */
  readonly isClean: boolean;
}

export type TritoneCountSearchReason =
  | 'OK'
  | 'INVALID_DELTA'
  | 'NO_TARGET_COUNT'
  | 'KEEP_POSITION_OUT_OF_RANGE'
  | 'NO_CANDIDATE';

export interface TritoneCountSearch {
  readonly source: TritoneCountScaleName;
  readonly sourceKey: number;
  readonly sourceNotes: readonly number[];
  readonly sourceTritones: readonly NotePair[];
  readonly delta: number;
  readonly targetTritoneCount: number;
  readonly keepPosition: number | null;
  readonly best: TritoneCountCandidate | null;
  readonly ties: readonly TritoneCountCandidate[];
  readonly candidates: readonly TritoneCountCandidate[];
  readonly reason: TritoneCountSearchReason;
}

export interface TritoneInversion {
  readonly scale: TritoneCountScaleName;
  readonly sourceKey: number;
  readonly key: number;
  readonly notes: readonly number[];
  readonly tritones: readonly NotePair[];
}

const NOTE_NAMES = [
  'C',
  'C#',
  'D',
  'Eb',
  'E',
  'F',
  'F#',
  'G',
  'G#',
  'A',
  'Bb',
  'B'
] as const;

function modulo(value: number, divisor: number): number {
  return ((value % divisor) + divisor) % divisor;
}

function samePair(left: NotePair, right: NotePair): boolean {
  return left[0] === right[0] && left[1] === right[1];
}

function scaleType(name: TritoneCountScaleName): ScaleTypes {
  return ScaleTypes[name];
}

/** Notes in scale order: from the key upwards, wrapping at 12. */
export function orderedNotes(
  scale: TritoneCountScaleName,
  key: number
): number[] {
  const base = Scale.getScaleByType(scaleType(scale)).notes;
  const actual = [...new Set(base.map(note => modulo(note + key, 12)))];
  return actual.sort(
    (left, right) => modulo(left - key, 12) - modulo(right - key, 12)
  );
}

/**
 * Tritones oriented by their first appearance in scale order.
 *
 * A pair is written `[first, second]`. If the first note of the pair appears
 * after its tritone partner in the scale, the pair is skipped here and emitted
 * from the partner instead, so every tritone appears exactly once.
 */
export function orderedTritones(
  scale: TritoneCountScaleName,
  key: number
): NotePair[] {
  const notes = orderedNotes(scale, key);
  const indexes = new Map(notes.map((note, index) => [note, index]));
  const pairs: NotePair[] = [];

  for (const note of notes) {
    const partner = modulo(note + 6, 12);
    const partnerIndex = indexes.get(partner);
    if (partnerIndex !== undefined && indexes.get(note)! < partnerIndex) {
      pairs.push([note, partner]);
    }
  }

  return pairs;
}

const AVAILABLE_TRITONE_COUNTS = new Set(
  TRITONE_COUNT_SCALE_NAMES.map(scale => orderedTritones(scale, 0).length)
);

function keyDistance(left: number, right: number): number {
  const distance = Math.abs(left - right);
  return Math.min(distance, 12 - distance);
}

function compareCandidates(
  left: TritoneCountCandidate,
  right: TritoneCountCandidate,
  sourceKey: number
): number {
  return (
    right.preserved.length - left.preserved.length ||
    left.changedNotes - right.changedNotes ||
    keyDistance(left.key, sourceKey) - keyDistance(right.key, sourceKey) ||
    TRITONE_COUNT_SCALE_NAMES.indexOf(left.scale) -
      TRITONE_COUNT_SCALE_NAMES.indexOf(right.scale) ||
    left.key - right.key
  );
}

function buildCandidate(
  sourceNotes: readonly number[],
  sourceTritones: readonly NotePair[],
  scale: TritoneCountScaleName,
  key: number,
  delta: number,
  keepPosition: number | null
): TritoneCountCandidate | null {
  const notes = orderedNotes(scale, key);
  const tritones = orderedTritones(scale, key);
  const preserved = sourceTritones.filter(pair =>
    tritones.some(candidate => samePair(candidate, pair))
  );
  const added = tritones.filter(pair =>
    !sourceTritones.some(candidate => samePair(candidate, pair))
  );
  const removed = sourceTritones.filter(pair =>
    !tritones.some(candidate => samePair(candidate, pair))
  );

  let keptPair: NotePair | null = null;
  let keptSourcePosition: number | null = null;
  let keptTargetPosition: number | null = null;

  if (keepPosition !== null) {
    if (delta > 0) {
      const pair = tritones[keepPosition - 1] ?? null;
      if (!pair || !preserved.some(candidate => samePair(candidate, pair))) {
        return null;
      }
      keptPair = pair;
      keptTargetPosition = keepPosition;
      const sourceIndex = sourceTritones.findIndex(candidate =>
        samePair(candidate, pair)
      );
      keptSourcePosition = sourceIndex >= 0 ? sourceIndex + 1 : null;
    } else {
      const pair = sourceTritones[keepPosition - 1] ?? null;
      if (!pair || !preserved.some(candidate => samePair(candidate, pair))) {
        return null;
      }
      keptPair = pair;
      keptSourcePosition = keepPosition;
      const targetIndex = tritones.findIndex(candidate =>
        samePair(candidate, pair)
      );
      keptTargetPosition = targetIndex >= 0 ? targetIndex + 1 : null;
    }
  }

  const sharedNotes = sourceNotes.filter(note => notes.includes(note)).length;
  const outNotes = sourceNotes.filter(note => !notes.includes(note));
  const inNotes = notes.filter(note => !sourceNotes.includes(note));
  const preservesAll = preserved.length === sourceTritones.length;
  const isClean =
    delta > 0
      ? preservesAll
      : removed.length === 1 &&
        preserved.length === sourceTritones.length - 1;

  return {
    scale,
    key,
    notes,
    tritones,
    preserved,
    added,
    removed,
    outNotes,
    inNotes,
    sharedNotes,
    changedNotes: outNotes.length + inNotes.length,
    keptPair,
    keptSourcePosition,
    keptTargetPosition,
    preservesAll,
    isClean
  };
}

/**
 * Search a target scale/key that adds or removes `delta` tritones.
 *
 * `keepPosition` is 1-based. When adding, it is the position of the preserved
 * tritone in the target. When removing, it is the position of the source
 * tritone that must survive. `null`/`undefined` disables the position filter.
 *
 * `delta = -1` from WHITE (1 -> 0) and `delta = +1` from BLACK/FULL (5/7
 * tritones) have no parent-scale target and return `NO_TARGET_COUNT`.
 */
export function findTritoneCountModulation(
  source: TritoneCountScaleName,
  sourceKey: number,
  delta: number,
  keepPosition?: number | null
): TritoneCountSearch {
  const normalizedKey = modulo(sourceKey, 12);
  const sourceNotes = orderedNotes(source, normalizedKey);
  const sourceTritones = orderedTritones(source, normalizedKey);
  const targetTritoneCount = sourceTritones.length + delta;
  const position = keepPosition ?? null;
  const base = {
    source,
    sourceKey: normalizedKey,
    sourceNotes,
    sourceTritones,
    delta,
    targetTritoneCount,
    keepPosition: position
  };

  if (!Number.isInteger(delta) || delta === 0) {
    return {
      ...base,
      best: null,
      ties: [],
      candidates: [],
      reason: 'INVALID_DELTA'
    };
  }

  if (
    targetTritoneCount < 0 ||
    targetTritoneCount > 6 ||
    !AVAILABLE_TRITONE_COUNTS.has(targetTritoneCount)
  ) {
    return {
      ...base,
      best: null,
      ties: [],
      candidates: [],
      reason: 'NO_TARGET_COUNT'
    };
  }

  if (position !== null) {
    const maxPosition = delta > 0 ? targetTritoneCount : sourceTritones.length;
    if (
      !Number.isInteger(position) ||
      position < 1 ||
      position > maxPosition
    ) {
      return {
        ...base,
        best: null,
        ties: [],
        candidates: [],
        reason: 'KEEP_POSITION_OUT_OF_RANGE'
      };
    }
  }

  const candidates: TritoneCountCandidate[] = [];
  for (const scale of TRITONE_COUNT_SCALE_NAMES) {
    for (let key = 0; key < 12; key += 1) {
      if (orderedTritones(scale, key).length !== targetTritoneCount) {
        continue;
      }
      const candidate = buildCandidate(
        sourceNotes,
        sourceTritones,
        scale,
        key,
        delta,
        position
      );
      if (candidate) {
        candidates.push(candidate);
      }
    }
  }

  if (candidates.length === 0) {
    return {
      ...base,
      best: null,
      ties: [],
      candidates: [],
      reason: 'NO_CANDIDATE'
    };
  }

  candidates.sort((left, right) =>
    compareCandidates(left, right, normalizedKey)
  );
  const best = candidates[0];
  const ties = candidates.filter(
    candidate =>
      candidate.preserved.length === best.preserved.length &&
      candidate.changedNotes === best.changedNotes
  );

  return {
    ...base,
    best,
    ties,
    candidates,
    reason: 'OK'
  };
}

/**
 * `INVERT TRITONE`: keep the scale and its view, move the key six semitones.
 * Every tritone pair stays as a set; its orientation is reversed.
 */
export function invertTritone(
  scale: TritoneCountScaleName,
  sourceKey: number
): TritoneInversion {
  const normalizedKey = modulo(sourceKey, 12);
  const key = modulo(normalizedKey + 6, 12);
  return {
    scale,
    sourceKey: normalizedKey,
    key,
    notes: orderedNotes(scale, key),
    tritones: orderedTritones(scale, key)
  };
}

export function noteName(note: number): string {
  return NOTE_NAMES[modulo(note, 12)];
}

export function formatPair(pair: NotePair): string {
  return `${noteName(pair[0])}-${noteName(pair[1])}`;
}

export function formatPairs(pairs: readonly NotePair[]): string {
  return pairs.length === 0 ? '∅' : pairs.map(formatPair).join(' ');
}

export function formatCandidate(candidate: TritoneCountCandidate): string {
  return [
    `${candidate.scale} key=${candidate.key}`,
    `tritones=${formatPairs(candidate.tritones)}`,
    `preserved=${formatPairs(candidate.preserved)}`,
    `added=${formatPairs(candidate.added)}`,
    `removed=${formatPairs(candidate.removed)}`,
    `out={${candidate.outNotes.join(',')}}`,
    `in={${candidate.inNotes.join(',')}}`,
    `changed=${candidate.changedNotes}`,
    candidate.isClean ? 'clean' : 'swap'
  ].join(' | ');
}
