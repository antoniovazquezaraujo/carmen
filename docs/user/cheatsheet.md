# `.mr` syntax cheatsheet

## Structure

```mr
song "Song name"
version 2
repeats 2        # song repetitions (1 = omitted)
bpm 90           # tempo (120 = omitted)

vars
  $oct = 2
  $motif = "4t:0 4t:2"

melodies
  melody Riff
    notes
      4n:0
      4n:3

  melody Theme
    notes default 8n
      4n:0
      4n:( 0 2 )
      s

presets
  preset RiffAjustes
    OCT $oct
    SCALE WHITE

  preset ThemeAjustes
    OCT $oct
    SCALE WHITE
    PLAYMODE ASCENDING

procedures
  procedure Rise
    VARY $oct 1
    ASSIGN $scale BLACK

part Piano instrument PIANO
  block Riff repeats 2
    preset RiffAjustes
    melody Riff

  block Theme repeats 2
    preset ThemeAjustes
    procedure Rise
    melody Theme

    block Answer
      melody Theme
```

## Content libraries

- Order: `vars` → `melodies` → `presets` → `procedures` → `part*`. Each library is optional, appears at most once and holds unique names.
- `melodies`: `melody <name>` plus one `notes` section (`notes`, `notes default <duration>` or `notes $variable`).
- `presets`: `preset <name>` plus playback settings (`OCT`, `SCALE`, `PLAYMODE`, `PATTERN`, `DECORATION`...).
- `procedures`: `procedure <name>` plus operations (`VARY`, `ASSIGN`).
- Libraries are leaves: they contain no blocks and no references to other library entries.
- A block is structure only: optional `preset`, `procedure` and `melody` references plus child blocks. No inline `notes`/`commands`/`operations`.
- In the GUI, drag a block by its handle to reorder it within a part or move it to another part. Drop it on another block's header to nest it as the last child. Child blocks can also be dragged to reorder or nest them.
- Drop a nested block on the dashed **Drop here to move it to the top level** zone at the bottom of a part to unparent it.
- Per pass: preset settings → procedure operations → melody notes → child blocks. `repeats` repeats the full pass, children included.
- Format 2 has no `blocks` section and no `use`: blocks are never referenced and there is no reader for `version 1`.

## Notes

- One event per line inside `notes`; groups fit on their own line.
- `duration:grade` (`4n:0`), rests `s`, negative grades (`-7`), groups `4n:( 0 2 )`, note variables `8t:$grade`.
- Intensity with `@`: `4n:0@34` (MIDI velocity 1–127), or on a group `4n:( 0 2 )@40`; children without their own `@` inherit it.
- Without an explicit duration an event inherits from its group. In `notes` sections groups **inherit**; inside a `PATTERN` groups **subdivide** (children without a duration split the remaining time).

## Durations

| Token | Figure | Beats | At 120 BPM |
|---|---|---|---|
| `1n` | Whole note | 4 | 2 s |
| `2n` | Half note | 2 | 1 s |
| `4n` | Quarter note | 1 | 0.5 s |
| `8n` | Eighth note | ½ | 0.25 s |
| `16n` | Sixteenth note | ¼ | 0.125 s |
| `4t` | Quarter-note triplet | ⅔ | 0.333 s |
| `8t` | Eighth-note triplet | ⅓ | 0.167 s |

## Preset settings

| Setting | Purpose | Example |
|---|---|---|
| `OCT` | Base octave | `OCT 2` |
| `OCTAVE_PATTERN` | Repeat the block's own melody at octave offsets | `OCTAVE_PATTERN 1 0 -1 2` |
| `SCALE` | Active scale | `SCALE BLACK` |
| `GAP` | Gap between chord notes | `GAP 2` |
| `PLAYMODE` | How grades sound | `PLAYMODE ASCENDING` |
| `WIDTH` | Extra chord notes | `WIDTH 3` |
| `INV` | Inversion | `INV 1` |
| `KEY` | Transposition in semitones | `KEY 0` |
| `SHIFTSTART`/`SHIFTSIZE`/`SHIFTVALUE` | Shift chord window by whole octaves | `SHIFTSIZE 3` |
| `INTENSITY` | Default intensity (MIDI velocity) | `INTENSITY 20` |
| `INTENSITY_PATTERN` | Cyclic intensity pattern | `INTENSITY_PATTERN 20 10 5` |
| `INTENSITY_RAMP` | Linear intensity ramp over generated notes | `INTENSITY_RAMP 4 11 20 60` |

The intensity profile (`INTENSITY`/`INTENSITY_PATTERN`/`INTENSITY_RAMP`) applies only to the block that declares it; children and siblings recover the previous profile. Other preset settings keep persisting.
| `PATTERN` | Pattern melody (or `$variable`) | `PATTERN 4t:0 4t:2` |
| `DECORATION` | Decoration added to each chord note (offsets in scale degrees) | `DECORATION 4t:0 8t:-2` |

Numeric settings accept `$variable`.

`OCTAVE_PATTERN` is relative to `OCT` and applies only to the block's own melody: `OCT 2` + `OCTAVE_PATTERN 1 0 -1 2` plays the sequence in octaves 3, 2, 1, 4. Child blocks keep their own octave/pattern.

## Procedures

- `VARY $variable step` — increment/decrement (numbers) or cycle (scales/playmodes).
- `ASSIGN $variable value` — assign.
- Input sugar: `+=`, `-=`, `++`, `--`, `=` (never emitted).

## Melody editor shortcuts

| Action | How |
|---|---|
| Select a note | Click |
| Change value | Wheel over the number |
| Change duration | Wheel over the duration (empty = inherited) |
| Note ↔ rest | `Space` |
| Parent group duration | `Shift+Space` |
| Delete | `Del` |
| Move focus | ← → |
| Value up/down | ↑ ↓ |

## `.mr` view

- **`.mr`** button: shows the canonical song text.
- **Validate** live; **Apply** rebuilds the GUI; **Revert** reloads from the model.
- **Save** downloads `<name>.mr`; **Load** validates and adopts the file (errors report `file:line:column`).
