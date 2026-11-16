#!/usr/bin/env node
'use strict';

/**
 * Small executable report for the experimental tritone model (ADR-005).
 * Run with: npm run lab:tritones
 */

const {
  TRITONE_SCALES,
  formatModulation,
  hideTritones,
  modulate
} = require('../packages/core/dist/experimental/tritone-lab.js');

const pairList = pairs => pairs.length === 0
  ? '∅'
  : pairs.map(([start, end]) => `(${start},${end})`).join(' ');

console.log('Tritone patterns\n');
for (const name of Object.keys(TRITONE_SCALES)) {
  const scale = TRITONE_SCALES[name];
  console.log(`${name.padEnd(5)} starts=${pairList(scale.tritones)} notes={${scale.notes.join(',')}}`);
}

console.log('\nAnchored modulation\n');
console.log(formatModulation(modulate('WHITE', 'BLUE', 1, 2)));
console.log(formatModulation(modulate('BLUE', 'WHITE', 1, 1)));

console.log('\nHidden tritones\n');
for (const selection of ['LOW', 'HIGH', 'ALL']) {
  const hidden = hideTritones('BLUE', selection);
  console.log(
    `BLUE ${selection.padEnd(4)} visible={${hidden.notes.join(',')}} ` +
    `remaining=${pairList(hidden.tritones)}`
  );
}

const white = hideTritones('WHITE', 'LOW');
console.log(`WHITE LOW  visible={${white.notes.join(',')}} remaining=${pairList(white.tritones)}`);
