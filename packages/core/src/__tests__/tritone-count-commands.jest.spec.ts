import { Procedure } from '../content';
import { InstrumentType } from '../instrument-type';
import {
  AddTritoneOperation,
  cloneOperation,
  InvertTritoneOperation,
  isModulationOperation,
  RemoveTritoneOperation
} from '../operation';
import { parseSong } from '../mr/mr.parser';
import { serializeSong } from '../mr/mr.serializer';
import { Player } from '../player';
import { ScaleTypes } from '../scale';

const SONG = `song "Tritone count"
version 3

melodies
  melody Tema
    notes
      4n:0

procedures
  procedure Cambios
    ADD TRITONE KEEP 1
    REMOVE TRITONE KEEP 2
    INVERT TRITONE

part Piano
  block A
    procedure Cambios
    melody Tema
`;

const audioEngine = {
  setTransportBpm: jest.fn()
};

const createPlayer = (): Player =>
  new Player(0, InstrumentType.PIANO, 'test', audioEngine);

describe('ADD/REMOVE/INVERT TRITONE commands', () => {
  it('parses and serializes the three operations', () => {
    const document = parseSong(SONG);
    const operations = document.song.procedures[0].operations;

    expect(operations).toHaveLength(3);
    expect(operations[0]).toBeInstanceOf(AddTritoneOperation);
    expect((operations[0] as AddTritoneOperation).keepPosition).toBe(1);
    expect(operations[1]).toBeInstanceOf(RemoveTritoneOperation);
    expect((operations[1] as RemoveTritoneOperation).keepPosition).toBe(2);
    expect(operations[2]).toBeInstanceOf(InvertTritoneOperation);

    const serialized = serializeSong(document);
    expect(serialized).toContain('ADD TRITONE KEEP 1');
    expect(serialized).toContain('REMOVE TRITONE KEEP 2');
    expect(serialized).toContain('INVERT TRITONE');
  });

  it('adds a tritone from WHITE D and keeps the first target position', () => {
    const player = createPlayer();
    player.scale = ScaleTypes.WHITE;
    player.tonality = 2;

    const result = player.addTritone(1);

    expect(result.best?.scale).toBe('RED');
    expect(result.best?.key).toBe(4);
    expect(player.scale).toBe(ScaleTypes.RED);
    expect(player.tonality).toBe(4);
  });

  it('adds a tritone from WHITE D and keeps the second target position', () => {
    const player = createPlayer();
    player.scale = ScaleTypes.WHITE;
    player.tonality = 2;

    player.addTritone(2);

    expect(player.scale).toBe(ScaleTypes.RED);
    expect(player.tonality).toBe(0);
  });

  it('does not change WHITE when removing its only tritone', () => {
    const player = createPlayer();
    player.scale = ScaleTypes.WHITE;
    player.tonality = 2;

    const result = player.removeTritone(1);

    expect(result.best).toBeNull();
    expect(player.scale).toBe(ScaleTypes.WHITE);
    expect(player.tonality).toBe(2);
  });

  it('removes a tritone from BLUE G keeping the first source position', () => {
    const player = createPlayer();
    player.scale = ScaleTypes.BLUE;
    player.tonality = 7;

    player.removeTritone(1);

    expect(player.scale).toBe(ScaleTypes.WHITE);
    expect(player.tonality).toBe(6);
  });

  it('removes a tritone from BLUE G keeping the second source position', () => {
    const player = createPlayer();
    player.scale = ScaleTypes.BLUE;
    player.tonality = 7;

    player.removeTritone(2);

    expect(player.scale).toBe(ScaleTypes.WHITE);
    expect(player.tonality).toBe(8);
  });

  it('inverts the tritone with KEY + 6', () => {
    const player = createPlayer();
    player.scale = ScaleTypes.WHITE;
    player.tonality = 2;

    const result = player.invertTritone();

    expect(result.key).toBe(8);
    expect(result.tritones).toEqual([[11, 5]]);
    expect(player.scale).toBe(ScaleTypes.WHITE);
    expect(player.tonality).toBe(8);
  });

  it('runs the operations through execute', () => {
    const player = createPlayer();
    player.scale = ScaleTypes.WHITE;
    player.tonality = 2;

    new AddTritoneOperation(1).execute(player);
    expect(player.scale).toBe(ScaleTypes.RED);
    expect(player.tonality).toBe(4);

    new InvertTritoneOperation().execute(player);
    expect(player.tonality).toBe(10);
  });

  it('warns when REMOVE TRITONE has no effect on WHITE', () => {
    const player = createPlayer();
    player.scale = ScaleTypes.WHITE;
    player.tonality = 2;
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);

    new RemoveTritoneOperation(1).execute(player);

    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('use COLLAPSE to reach PENTA')
    );
    expect(player.scale).toBe(ScaleTypes.WHITE);
    expect(player.tonality).toBe(2);
    warn.mockRestore();
  });

  it('marks the new operations as modulation operations', () => {
    expect(isModulationOperation(new AddTritoneOperation(1))).toBe(true);
    expect(isModulationOperation(new RemoveTritoneOperation(1))).toBe(true);
    expect(isModulationOperation(new InvertTritoneOperation())).toBe(true);
  });

  it('clones the new operations', () => {
    const add = cloneOperation(new AddTritoneOperation(2));
    const remove = cloneOperation(new RemoveTritoneOperation(1));
    const invert = cloneOperation(new InvertTritoneOperation());

    expect(add).toBeInstanceOf(AddTritoneOperation);
    expect((add as AddTritoneOperation).keepPosition).toBe(2);
    expect(remove).toBeInstanceOf(RemoveTritoneOperation);
    expect((remove as RemoveTritoneOperation).keepPosition).toBe(1);
    expect(invert).toBeInstanceOf(InvertTritoneOperation);
  });

  it('serializes the new operations in a procedure JSON', () => {
    const procedure = new Procedure();
    procedure.operations = [
      new AddTritoneOperation(1),
      new RemoveTritoneOperation(2),
      new InvertTritoneOperation()
    ];

    expect(procedure.toJSON().operations).toEqual([
      { type: 'ADD_TRITONE', keepPosition: 1 },
      { type: 'REMOVE_TRITONE', keepPosition: 2 },
      { type: 'INVERT_TRITONE' }
    ]);
  });

  it('rejects malformed ADD/REMOVE/INVERT lines', () => {
    const invalid = (line: string): string =>
      SONG.replace('ADD TRITONE KEEP 1', line);

    expect(() => parseSong(invalid('ADD TRITONE 1'))).toThrow(/ADD requiere/);
    expect(() => parseSong(invalid('ADD TRITONE KEEP 0'))).toThrow(
      /posición entera >= 1/
    );
    expect(() => parseSong(invalid('REMOVE TRITONE KEEP x'))).toThrow(
      /REMOVE TRITONE KEEP requiere/
    );
    expect(() => parseSong(invalid('INVERT'))).toThrow(/INVERT requiere/);
    expect(() => parseSong(invalid('INVERT TRITONE EXTRA'))).toThrow(
      /INVERT requiere/
    );
  });
});
