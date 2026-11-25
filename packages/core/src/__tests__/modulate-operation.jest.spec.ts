import { InstrumentType } from '../instrument-type';
import { ModulateOperation } from '../operation';
import { parseSong } from '../mr/mr.parser';
import { serializeSong } from '../mr/mr.serializer';
import { Player } from '../player';
import { ScaleTypes } from '../scale';

const SONG = `song "Modulate"
version 3

melodies
  melody Tema
    notes
      4n:0

procedures
  procedure Cambio
    MODULATE BLUE FROM 1 TO 2

part Piano
  block Origen
    procedure Cambio
    melody Tema
`;

const audioEngine = {
    setTransportBpm: jest.fn()
};

const createPlayer = (): Player => new Player(0, InstrumentType.PIANO, 'test', audioEngine);

describe('MODULATE operation', () => {
    it('parses and serializes the anchoring syntax', () => {
        const document = parseSong(SONG);
        const operation = document.song.procedures[0].operations[0];

        expect(operation).toBeInstanceOf(ModulateOperation);
        expect((operation as ModulateOperation).targetScale).toBe(ScaleTypes.BLUE);
        expect((operation as ModulateOperation).fromOrdinal).toBe(1);
        expect((operation as ModulateOperation).toOrdinal).toBe(2);
        expect(serializeSong(document)).toContain('MODULATE BLUE FROM 1 TO 2');
    });

    it('accepts GREEN and PINK as modulation targets', () => {
        const document = parseSong(SONG.replace('MODULATE BLUE FROM 1 TO 2', 'MODULATE GREEN FROM 1 TO 1'));
        const operation = document.song.procedures[0].operations[0] as ModulateOperation;

        expect(operation.targetScale).toBe(ScaleTypes.GREEN);
        expect(serializeSong(document)).toContain('MODULATE GREEN FROM 1 TO 1');
    });

    it('changes the player scale and key from the anchor', () => {
        const player = createPlayer();
        player.scale = ScaleTypes.WHITE;
        player.tonality = 0;

        player.modulate(ScaleTypes.BLUE, 1, 2);

        expect(player.scale).toBe(ScaleTypes.BLUE);
        expect(player.tonality).toBe(11);
    });

    it('runs the operation through its execute method', () => {
        const player = createPlayer();
        player.scale = ScaleTypes.WHITE;
        player.tonality = 0;

        new ModulateOperation(ScaleTypes.BLUE, 1, 2).execute(player);

        expect(player.scale).toBe(ScaleTypes.BLUE);
        expect(player.tonality).toBe(11);
    });

    it('rejects an invalid source ordinal at runtime', () => {
        const player = createPlayer();
        player.scale = ScaleTypes.WHITE;

        expect(() => player.modulate(ScaleTypes.BLUE, 2, 1)).toThrow(RangeError);
    });

    it('rejects malformed MODULATE lines', () => {
        const invalid = (line: string): string => SONG.replace('MODULATE BLUE FROM 1 TO 2', line);

        expect(() => parseSong(invalid('MODULATE BLUE 1 2'))).toThrow(/MODULATE requiere/);
        expect(() => parseSong(invalid('MODULATE BLUE FROM 1 TO 9'))).toThrow(/fuera de rango/);
        expect(() => parseSong(invalid('MODULATE PENTA FROM 1 TO 1'))).toThrow(/PENTA se eliminó/);
        expect(() => parseSong(invalid('MODULATE FUCSIA FROM 1 TO 1'))).toThrow(/escala desconocida/);
    });
});
