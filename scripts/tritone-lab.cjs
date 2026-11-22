#!/usr/bin/env node
'use strict';

/**
 * Small executable report for the experimental tritone model (ADR-005) and
 * the tritone-count search prototype.
 * Run with: npm run lab:tritones
 */

const {
  TRITONE_SCALES,
  formatSemitoneView,
  hideSemitones,
  SEMITONE_VIEW_SELECTIONS
} = require('../packages/core/dist/experimental/tritone-lab.js');
const { modulate } = require('../packages/core/dist/tritone-modulation.js');
const {
  findTritoneCountModulation,
  formatCandidate,
  formatPairs,
  invertTritone,
  orderedTritones
} = require('../packages/core/dist/tritone-count.js');
const { ScaleTypes } = require('../packages/core/dist/scale.js');

const pairList = pairs => pairs.length === 0
  ? '∅'
  : pairs.map(([start, end]) => `(${start},${end})`).join(' ');

const SCALE_ENUM = {
  WHITE: ScaleTypes.WHITE,
  BLUE: ScaleTypes.BLUE,
  RED: ScaleTypes.RED,
  BLACK: ScaleTypes.BLACK,
  TONES: ScaleTypes.TONES,
  FULL: ScaleTypes.FULL
};

const formatAnchored = result => [
  `${ScaleTypes[result.source]} -> ${ScaleTypes[result.target]} (${result.fromOrdinal}->${result.toOrdinal})`,
  `key=${result.key}`,
  `fixed=${pairList(result.fixed)}`,
  `added=${pairList(result.added)}`,
  `removed=${pairList(result.removed)}`
].join(' | ');

const printAnchor = (source, target, fromOrdinal, toOrdinal, sourceKey = 0) => {
  const result = modulate(
    SCALE_ENUM[source],
    SCALE_ENUM[target],
    fromOrdinal,
    toOrdinal,
    sourceKey
  );
  console.log(`sourceKey=${sourceKey} | ${formatAnchored(result)}`);
};

const VIEW_LABELS = {
  'HIGH/HIGH': 'subir/subir',
  'LOW/LOW': 'bajar/bajar',
  'LOW/HIGH': 'bajar/subir',
  'HIGH/LOW': 'subir/bajar'
};

console.log('Tritone patterns\n');
for (const name of Object.keys(TRITONE_SCALES)) {
  const scale = TRITONE_SCALES[name];
  console.log(`${name.padEnd(5)} starts=${pairList(scale.tritones)} notes={${scale.notes.join(',')}}`);
}

console.log('\nAnchored modulation\n');
printAnchor('WHITE', 'BLUE', 1, 2);
printAnchor('BLUE', 'WHITE', 1, 1);
printAnchor('WHITE', 'BLUE', 1, 1, 5);
printAnchor('RED', 'BLACK', 1, 1);
printAnchor('TONES', 'WHITE', 1, 1);
printAnchor('FULL', 'WHITE', 1, 1);

const printCount = (source, sourceKey, delta, keepPosition) => {
  const result = findTritoneCountModulation(
    source,
    sourceKey,
    delta,
    keepPosition
  );
  const sourceTritones = orderedTritones(source, sourceKey);
  const label = `${source} key=${sourceKey} tritones=${formatPairs(sourceTritones)}`;
  const keep = keepPosition === undefined ? '-' : keepPosition;

  if (result.reason !== 'OK' || !result.best) {
    console.log(`${label} | delta=${delta} keep=${keep} | ${result.reason}`);
    return;
  }

  console.log(
    `${label} | delta=${delta} keep=${keep} | ${formatCandidate(result.best)} | ties=${result.ties.length}`
  );
};

console.log('\nTritone-count modulation\n');
printCount('WHITE', 2, 1, 1);
printCount('WHITE', 2, 1, 2);
printCount('WHITE', 2, -1, 1);
printCount('BLUE', 7, -1, 1);
printCount('BLUE', 7, -1, 2);
printCount('TONES', 1, 1);
printCount('BLACK', 0, -1);
printCount('BLACK', 0, 1);

console.log('\nINVERT TRITONE\n');
for (const [scale, key] of [
  ['WHITE', 2],
  ['BLUE', 7]
]) {
  const inverted = invertTritone(scale, key);
  console.log(
    `${scale} key=${key} -> key=${inverted.key} tritones=${formatPairs(inverted.tritones)}`
  );
}

console.log('\nSemitone views (WHITE/BLUE/RED/BLACK)\n');
for (const name of ['WHITE', 'BLUE', 'RED', 'BLACK']) {
  for (const selection of SEMITONE_VIEW_SELECTIONS) {
    const view = hideSemitones(name, selection);
    const label = VIEW_LABELS[selection.join('/')];
    console.log(`${label.padEnd(11)} ${formatSemitoneView(view)}`);
  }
}
