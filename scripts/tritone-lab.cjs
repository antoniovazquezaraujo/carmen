#!/usr/bin/env node
'use strict';

/**
 * Small executable report for the experimental tritone model (ADR-005).
 * Run with: npm run lab:tritones
 */

const {
  TRITONE_SCALES,
  formatModulation,
  formatSemitoneView,
  hideSemitones,
  modulate,
  SEMITONE_VIEW_SELECTIONS
} = require('../packages/core/dist/experimental/tritone-lab.js');

const pairList = pairs => pairs.length === 0
  ? '∅'
  : pairs.map(([start, end]) => `(${start},${end})`).join(' ');

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
console.log(formatModulation(modulate('WHITE', 'BLUE', 1, 2)));
console.log(formatModulation(modulate('BLUE', 'WHITE', 1, 1)));

console.log('\nSemitone views (WHITE/BLUE)\n');
for (const name of ['WHITE', 'BLUE']) {
  for (const selection of SEMITONE_VIEW_SELECTIONS) {
    const view = hideSemitones(name, selection);
    const label = VIEW_LABELS[selection.join('/')];
    console.log(`${label.padEnd(11)} ${formatSemitoneView(view)}`);
  }
}
