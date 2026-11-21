#!/usr/bin/env node
'use strict';

/**
 * Small executable report for the experimental tritone model (ADR-005).
 * Run with: npm run lab:tritones
 */

const {
  TRITONE_SCALES,
  formatSemitoneView,
  hideSemitones,
  SEMITONE_VIEW_SELECTIONS
} = require('../packages/core/dist/experimental/tritone-lab.js');
const { modulate } = require('../packages/core/dist/tritone-modulation.js');
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

console.log('\nSemitone views (WHITE/BLUE/RED/BLACK)\n');
for (const name of ['WHITE', 'BLUE', 'RED', 'BLACK']) {
  for (const selection of SEMITONE_VIEW_SELECTIONS) {
    const view = hideSemitones(name, selection);
    const label = VIEW_LABELS[selection.join('/')];
    console.log(`${label.padEnd(11)} ${formatSemitoneView(view)}`);
  }
}
