import { Command, CommandType } from '../command';
import { parseSong } from '../mr/mr.parser';
import { serializeSong } from '../mr/mr.serializer';
import { VariableContext } from '../variable.context';

const SONG = `song "Collapse"
version 3

melodies
  melody Origen
    notes
      4n:0

part "Piano"
  block "Origen"
    melody Origen
    overrides
      SCALE WHITE
      COLLAPSE BOTH_HIGH
`;

describe('COLLAPSE command', () => {
    it('parses and serializes a collapse mode', () => {
        const document = parseSong(SONG);
        const block = document.song.parts[0].items[0];

        expect(block.overrides.map(command => command.type)).toEqual([
            CommandType.SCALE,
            CommandType.COLLAPSE
        ]);
        expect(block.overrides[1].value).toBe('BOTH_HIGH');
        expect(serializeSong(document)).toContain('COLLAPSE BOTH_HIGH');
    });

    it('rejects unknown collapse modes', () => {
        const invalid = SONG.replace('BOTH_HIGH', 'MIXED');

        expect(() => parseSong(invalid)).toThrow(/collapse desconocido/);
    });

    it('rejects PENTA with a migration message', () => {
        const legacy = SONG.replace('SCALE WHITE', 'SCALE PENTA');

        expect(() => parseSong(legacy)).toThrow(/PENTA se eliminó/);
    });

    it('accepts and serializes a collapse variable', () => {
        const document = parseSong(`song "Collapse"
version 3

vars
  $mode = BOTH_LOW

melodies
  melody Origen
    notes
      4n:0

part "Piano"
  block "Origen"
    melody Origen
    overrides
      COLLAPSE $mode
`);
        const command = document.song.parts[0].items[0].overrides[0];

        expect(command.type).toBe(CommandType.COLLAPSE);
        expect(command.isVariable).toBe(true);
        const serialized = serializeSong(document);
        expect(serialized).toContain('$mode = BOTH_LOW');
        expect(serialized).toContain('COLLAPSE $mode');
    });

    it('executes the collapse mode on a player', () => {
        const player = { collapse: 'NONE' };
        new Command({ type: CommandType.COLLAPSE, value: 'HIGH_LOW' }).execute(player);

        expect(player.collapse).toBe('HIGH_LOW');
    });

    it('resolves a collapse variable when executed', () => {
        const snapshot = VariableContext.snapshot();
        try {
            VariableContext.setValue('view', 'HIGH_LOW');
            const player = { collapse: 'NONE' };

            new Command({ type: CommandType.COLLAPSE, value: 'view', isVariable: true }).execute(player);

            expect(player.collapse).toBe('HIGH_LOW');
        } finally {
            VariableContext.restore(snapshot);
        }
    });

    it('falls back to COLLAPSE NONE for an invalid mode', () => {
        const player = { collapse: 'BOTH_HIGH' };
        const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);

        new Command({ type: CommandType.COLLAPSE, value: 'MIXED' }).execute(player);

        expect(player.collapse).toBe('NONE');
        expect(warn).toHaveBeenCalled();
        warn.mockRestore();
    });
});
