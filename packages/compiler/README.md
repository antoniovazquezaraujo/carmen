# carmen-cli

Browser-free `.mr` → MIDI compiler and command-line interface for [Carmen](https://github.com/antoniovazquezaraujo/carmen).

```sh
npm install -g carmen-cli

carmen compile song.mr
carmen compile song.mr -o song.mid
carmen check song.mr
carmen version
```

The package exposes a single `carmen` binary; there is no separate legacy binary.

Use `-` as the input to read `.mr` from stdin. `--json` writes the compiled event model instead of a MIDI file. See the [user documentation](https://github.com/antoniovazquezaraujo/carmen/blob/develop/docs/user/midi.md) for options and limitations.

Licensed under Apache-2.0.
