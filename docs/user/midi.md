# MIDI compiler (experimental)

Carmen can compile a `.mr` song to a **Standard MIDI File** without opening the browser.

## Requirements

- Node 22 or newer.
- The published `carmen-cli` package, or a clone of the repository with dependencies installed (`npm ci`).

## Install

Install the CLI globally:

```sh
npm install -g carmen-cli
```

You can also build the CLI from a clone:

```sh
npm run build:cli
```

## Usage

With the global command:

```sh
carmen compile cancion.mr
carmen compile cancion.mr -o salida.mid
carmen compile cancion.mr --json
carmen check cancion.mr
carmen version
```

From a clone, replace `carmen` with `node packages/compiler/dist/cli/main.js`:

```sh
node packages/compiler/dist/cli/main.js compile cancion.mr
node packages/compiler/dist/cli/main.js check cancion.mr
```

`npm run midi -- cancion.mr` is a development shortcut that builds the CLI first.

You can also read the song from stdin:

```sh
cat cancion.mr | carmen compile - -o salida.mid
```

The CLI exposes a single `carmen` binary; there is no separate legacy binary.

## Commands

| Command | Effect |
|---|---|
| `carmen compile <song.mr>` | Compile to a Standard MIDI File (or JSON with `--json`). |
| `carmen check <song.mr>` | Validate the `.mr` document without generating output. |
| `carmen version` | Show the CLI version. |
| `carmen help` | Show the global help. |

## Compile options

| Option | Effect |
|---|---|
| `-o, --output <file>` | Output file; by default, the input name with `.mid` (or `.json`). |
| `--ppq <n>` | Ticks per quarter note (default 960). |
| `--json` | Write the compiled event model instead of MIDI. |
| `--quiet` | Do not print the success summary or warnings. |
| `-h, --help` | Show the `compile` help. |

`check` accepts `--quiet` and `-h/--help`.

The default output is the input file with a `.mid` extension. `--json` writes the compiled event model instead of MIDI, which is useful for checking ticks and notes.

## What it generates

- A Standard MIDI File **type 1**.
- One track per part; the first track carries the tempo and time signature.
- Piano as the General MIDI instrument (program 0).
- 960 ticks per quarter note by default (`--ppq` changes it).
- The same musical semantics as the app: parts, structural blocks, `melodies`/`presets`/`procedures` content libraries, repeats, settings, operations, `PATTERN`, chords and arpeggios.

MIDI is not audio: open the file in a DAW, VLC, MuseScore or render it with a synthesizer such as FluidSynth.

## Current limitations

- No WAV/MP3 export yet.
- 4/4 time signature and piano program in this first version. Intensity comes from the score (`@`, `INTENSITY`, `INTENSITY_PATTERN`, `INTENSITY_RAMP`) and is written as MIDI velocity 1–127; without a profile it defaults to 90.
- The current `.mr` language limitations are inherited (for example, string variables used as a single note are not expanded).
- Notes outside the MIDI range 0–127 are transposed by octaves and reported as warnings.

The internal design and current limitations are documented in [`docs/developer/analysis/compilador-midi-mvp.md`](../developer/analysis/compilador-midi-mvp.md).
