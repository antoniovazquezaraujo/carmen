import { parseSong } from 'src/app/model/mr';
import { Song } from 'src/app/model/song';

/**
 * Small, valid song used by the "Load example" action and the help panel.
 * It uses the format 2 content libraries (melodies/presets) and structural
 * blocks.
 */
export const DEMO_SONG_MR = `song "First Light"
version 2
repeats 1
bpm 96

melodies
  melody Bassline
    notes
      2n:-7
      2n:-5
      2n:-3
      2n:-5

  melody Theme
    notes
      4n:0
      4n:2
      4n:4
      4n:2

  melody Answer
    notes
      4n:4
      4n:2
      4n:0
      2n:s

presets
  preset BassAjustes
    OCT 0
    PLAYMODE CHORD
    WIDTH 0
    GAP 2

  preset ThemeAjustes
    SCALE WHITE
    OCT 3
    PLAYMODE ASCENDING
    GAP 1
    WIDTH 1

  preset AnswerAjustes
    OCT 4
    PLAYMODE DESCENDING

part Piano
  block Theme repeats 2
    preset ThemeAjustes
    melody Theme

    block Answer
      preset AnswerAjustes
      melody Answer

part Bass
  block Bassline
    preset BassAjustes
    melody Bassline
`;

/** Parses the demo song; the corpus test keeps the fixture valid. */
export function createDemoSong(): Song {
    return parseSong(DEMO_SONG_MR).song;
}
