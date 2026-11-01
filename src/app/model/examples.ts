import { applyDocumentVariables, parseSong } from 'src/app/model/mr';
import { Song } from 'src/app/model/song';
import { DEMO_SONG_MR } from './demo-song';

export interface ExampleSong {
    id: string;
    title: string;
    description: string;
    tags: string[];
    bpm: number;
    mr: string;
}

/**
 * Curated examples shown in the in-app library. Every fixture is parsed by a
 * test, so the gallery can never load a broken song.
 */
export const EXAMPLE_SONGS: readonly ExampleSong[] = [
    {
        id: 'first-light',
        title: 'First Light',
        description: 'A gentle two-part miniature: a singing theme over a reusable bassline.',
        tags: ['Starter', 'Arpeggios', 'Reusable block'],
        bpm: 96,
        mr: DEMO_SONG_MR
    },
    {
        id: 'karmel',
        title: 'Karmel',
        description: 'An eleven-cycle modal canon with shifting scales, keys and octaves.',
        tags: ['Canon', '11 cycles', 'Odd/even'],
        bpm: 120,
        mr: `song Karmel
version 1
repeats 11

blocks
  block A
    notes
      4n:1
      4n:-2
      4n:4
    commands
      PLAYMODE ODD_ASC_EVEN_DESC
      WIDTH 3
      SCALE PENTA
      GAP 9
      OCT 0

  block B
    notes
      4n:1
      4n:-2
      4n:4
    commands
      PLAYMODE ODD_ASC_EVEN_DESC
      WIDTH 3
      SCALE WHITE
      GAP 6
      OCT 3

  block C
    notes
      4n:1
      4n:-2
      4n:4
    commands
      PLAYMODE EVEN_ASC_ODD_DESC
      WIDTH 4
      SCALE BLUE
      GAP 3
      OCT 2

part
  block

  use A repeats 2

  use B repeats 2

  use A repeats 4
    commands
      KEY 6
      SCALE BLUE

  use C repeats 2

part
  block

  use A repeats 2
    commands
      OCT -1

  use B repeats 2
    commands
      OCT -1

  use A repeats 4
    commands
      KEY 6
      SCALE BLUE
      OCT -1

  use C repeats 2
    commands
      OCT -1
`
    },
    {
        id: 'dodecaedro',
        title: 'Dodecaedro',
        description: 'A two-part, three-voice study built from A/B/C cells, stacked chords and decorated arpeggios.',
        tags: ['Chords', 'Decoration', 'Two parts'],
        bpm: 120,
        mr: `song Dodecaedro
version 1

blocks
  block A
    notes
      1n:1
      1n:2
      1n:-3

  block B
    notes
      1n:2
      1n:3
      1n:4

  block C
    notes
      1n:7
      1n:0
      1n:6

part
  block

  use A
    commands
      PLAYMODE CHORD
      WIDTH 3
      DECORATION 4n:3 8t:2
      INV 1

  use A
    commands
      PLAYMODE CHORD
      WIDTH 3
      DECORATION 4n:3 4n:2
      INV 1
      OCT 2
      GAP 6

  use A
    commands
      PLAYMODE CHORD
      WIDTH 1
      DECORATION 4n:2 4n:1
      INV 2
      OCT 2
      GAP 5

  use A
    commands
      PLAYMODE ASCENDING
      WIDTH 3
      DECORATION 4n:4 4n:2
      INV 1
      OCT 2
      GAP 7

  use B
    commands
      PLAYMODE ASCENDING
      WIDTH 3
      DECORATION 4n:3 4n:1
      INV 1
      OCT 2
      GAP 7

  use B
    commands
      PLAYMODE ASCENDING
      WIDTH 5
      DECORATION 4n:2 4n:0
      INV 2
      OCT 0
      GAP 7

  use C
    commands
      PLAYMODE ASCENDING
      WIDTH 2
      DECORATION 2n:2 1n:0
      INV 3
      OCT 1
      GAP 2

  block

part
  block

  use A
    commands
      PLAYMODE ASCENDING
      WIDTH 1
      INV 3
      OCT -1

  use A
    commands
      PLAYMODE ASCENDING
      WIDTH 1
      INV 1
      OCT -1
      GAP 1

  use A
    commands
      PLAYMODE ASCENDING
      WIDTH 1
      INV 1
      OCT -1
      GAP 1

  use A
    commands
      PLAYMODE ASCENDING
      WIDTH 1
      INV 1
      OCT -1
      GAP 1

  use B
    commands
      PLAYMODE ASCENDING
      WIDTH 1
      INV 1
      OCT -1
      GAP 1

  use B
    commands
      PLAYMODE ASCENDING
      WIDTH 1
      INV 1
      OCT -1
      GAP 1

  use C
    commands
      PLAYMODE ASC_DESC
      WIDTH 2
      INV 0
      OCT 0
      GAP 4
`
    },

    {
        id: 'glass-orbit',
        title: 'Glass Orbit',
        description: 'A pattern-driven orbit where variables change the mode and octave while it plays.',
        tags: ['Pattern', 'Variables', 'Operations'],
        bpm: 108,
        mr: `song "Glass Orbit"
version 1
repeats 2
bpm 108

vars
  $oct = 3
  $mode = ASCENDING
  $scale = BLUE

blocks
  block Orbit
    notes
      8n:0
      8n:2
      8n:4
      8n:6
    commands
      OCT $oct
      SCALE $scale
      PLAYMODE $mode
      WIDTH 2
      GAP 3
      PATTERN 4t:0 4t:-1 4t:2 4t:-2
    operations
      VARY $oct 1
      ASSIGN $mode EVEN_ASC_ODD_DESC

part Glass
  use Orbit repeats 2
`
    },
    {
        id: 'ocr-blues',
        title: 'OCR Blues',
        description: 'A nine-cycle blues in three octave layers, built on even/odd arpeggios and shifting keys.',
        tags: ['Blues', '9 cycles', 'Odd/even'],
        bpm: 120,
        mr: `song "OCR Blues"
version 1
repeats 9

blocks
  block A repeats 2
    notes
      4n:1
      4n:-2
      4n:2
      4n:0
    commands
      PLAYMODE EVEN_ASC_ODD_ASC
      WIDTH 3
      GAP 3

  block B repeats 2
    notes
      4n:2
      4n:0
      4n:5
      4n:-2
    commands
      PLAYMODE EVEN_ASC_ODD_ASC
      WIDTH 3
      GAP 4

  block C repeats 2
    notes
      4n:2
      4n:0
      4n:5
      4n:-2
    commands
      PLAYMODE EVEN_ASC_ODD_ASC
      WIDTH 3
      GAP 4
      KEY 2
      SCALE BLUE

  block D repeats 4
    notes
      4n:2
      4n:0
      4n:5
      4n:-2
    commands
      PLAYMODE EVEN_ASC_ODD_ASC
      WIDTH 3
      GAP 4
      KEY 4
      SCALE BLUE
      OCT 0

part
  block

  use A
    commands
      OCT 4

  use B
    commands
      OCT 4

  use C
    commands
      OCT 4

  use D
    commands
      OCT 2

part
  block

  use A
    commands
      OCT 0

  use B
    commands
      OCT 0

  use C
    commands
      OCT 0

part
  block

  use A
    commands
      OCT -1

  use B
    commands
      OCT -1

  use C
    commands
      OCT -1

  use D
    commands
      OCT 4
`
    },

    {
        id: 'clockwork',
        title: 'Clockwork',
        description: 'A mechanical single-note pattern that opens into an odd/even arpeggio.',
        tags: ['Pattern', 'Single notes', 'Odd/even'],
        bpm: 120,
        mr: `song Clockwork
version 1
repeats 2
bpm 120

part Piano
  block Main
    notes default 16n
      0
      2
      4
      6
      4
      2
    commands
      SCALE PENTA
      OCT 3
      PLAYMODE SINGLE
      PATTERN 8n:0 8n:2 8n:4 8n:2

  block Echo
    notes
      4n:0
      4n:2
    commands
      SCALE BLUE
      OCT 2
      PLAYMODE ODD_ASC_EVEN_DESC
      WIDTH 4
      GAP 2
`
    },
    {
        id: 'nocturne',
        title: 'Nocturne',
        description: 'A dark chord nocturne with inversion, octave shifts and a delicate decoration.',
        tags: ['Chord', 'Decoration', 'Inversion'],
        bpm: 72,
        mr: `song Nocturne
version 1
repeats 2
bpm 72

part Piano
  block Night
    notes
      2n:0
      2n:-3
      2n:2
      2n:-5
    commands
      SCALE BLACK
      OCT 2
      PLAYMODE CHORD
      WIDTH 3
      GAP 2
      INV 1
      SHIFTSTART 1
      SHIFTSIZE 2
      SHIFTVALUE 1
      DECORATION 4t:0 8t:-2

  block Glass
    notes
      4n:2
      4n:4
    commands
      SCALE BLUE
      OCT 3
      PLAYMODE EVEN_ASC_ODD_DESC
      WIDTH 4
      GAP 3
      DECORATION 0 4
`
    },
    {
        id: 'aurora',
        title: 'Aurora',
        description: 'A rising figure that changes scale, mode and key between each pass.',
        tags: ['Variables', 'Scale shift', 'Key'],
        bpm: 92,
        mr: `song Aurora
version 1
repeats 1
bpm 92

vars
  $mode = ASCENDING
  $scale = BLUE
  $oct = 2

blocks
  block Rise
    notes
      8n:0
      8n:2
      8n:4
      8n:6
    commands
      OCT $oct
      SCALE $scale
      PLAYMODE $mode
      WIDTH 3
      GAP 2
    operations
      VARY $oct 1
      ASSIGN $mode RANDOM
      ASSIGN $scale PENTA

part Aurora
  use Rise repeats 2

part Glass
  use Rise repeats 2
    commands
      KEY 7
      OCT 3
`
    },
    {
        id: 'rainfall',
        title: 'Rainfall',
        description: 'Fast pattern droplets with three-note decorations falling around each arpeggio.',
        tags: ['Pattern', 'Decoration', 'Arpeggio'],
        bpm: 100,
        mr: `song Rainfall
version 1
repeats 2
bpm 100

part Piano
  block Rain
    notes
      8n:0
      8n:2
      8n:-2
      8n:4
    commands
      SCALE WHITE
      OCT 3
      PLAYMODE EVEN_ASC_ODD_DESC
      WIDTH 2
      GAP 3
      PATTERN 4t:0 4t:-1
      DECORATION 16n:0 16n:2 16n:-2
`
    },
    {
        id: 'meridian',
        title: 'Meridian',
        description: 'A wide whole-tone line answered by a descending inversion in the upper octave.',
        tags: ['ASC/DESC', 'Inversion', 'Nested block'],
        bpm: 110,
        mr: `song Meridian
version 1
repeats 2
bpm 110

part Piano
  block Line
    notes
      4n:0
      4n:2
      4n:4
      4n:2
    commands
      SCALE TONES
      OCT 2
      PLAYMODE ASC_DESC
      WIDTH 4
      GAP 2
      INV 2

    block Answer
      notes
        8n:4
        8n:2
        8n:0
        8n:-2
      commands
        PLAYMODE DESC_ASC
        OCT 3
`
    },

];

export function createExampleSong(example: ExampleSong): Song {
    const document = parseSong(example.mr);
    // Examples may declare vars (`$oct`, `$mode`...). Apply them before the
    // song reaches the editor or the player so commands do not silently fall
    // back to defaults and the live panel can serialize the declaration.
    applyDocumentVariables(document);
    return document.song;
}
