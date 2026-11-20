import { Command, CommandType } from '../command';
import { InstrumentType } from '../instrument-type';
import { Player } from '../player';
import { ScaleTypes } from '../scale';

const audioEngine = {
    setTransportBpm: jest.fn()
};

const createPlayer = (): Player => {
    const player = new Player(0, InstrumentType.PIANO, 'test-instrument', audioEngine);
    player.selectedNote = 0;
    player.density = 2;
    player.gap = 2;
    return player;
};

describe('Player scale views', () => {
    it('uses the parent scale with COLLAPSE NONE', () => {
        const player = createPlayer();

        expect(player.getCurrentScale().notes).toEqual([0, 2, 3, 5, 7, 9, 10]);
    });

    it('applies a COLLAPSE view to the effective scale and to generated notes', () => {
        const player = createPlayer();
        player.collapse = 'BOTH_HIGH';

        expect(player.getCurrentScale().notes).toEqual([0, 3, 5, 7, 10]);
        expect(player.getSelectedNotes().map(note => note.note)).toEqual([60, 65, 70]);
    });

    it('applies the RED per-tritone views', () => {
        const player = createPlayer();
        player.scale = ScaleTypes.RED;
        player.collapse = 'BOTH_LOW';

        expect(player.getCurrentScale().notes).toEqual([0, 4, 7, 11]);
    });

    it('keeps the view when selectScale changes to a compatible parent', () => {
        const player = createPlayer();
        player.collapse = 'BOTH_HIGH';

        player.selectScale(ScaleTypes.BLUE);

        expect(player.collapse).toBe('BOTH_HIGH');
        expect(player.getCurrentScale().notes).toEqual([0, 2, 5, 8, 10]);
    });

    it('keeps the view as a no-op on FULL', () => {
        const player = createPlayer();
        player.collapse = 'BOTH_HIGH';

        player.selectScale(ScaleTypes.FULL);

        expect(player.collapse).toBe('BOTH_HIGH');
        expect(player.getCurrentScale().notes).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
    });

    it('clears the view with COLLAPSE NONE', () => {
        const player = createPlayer();
        player.collapse = 'LOW_HIGH';

        new Command({ type: CommandType.COLLAPSE, value: 'NONE' }).execute(player);

        expect(player.collapse).toBe('NONE');
        expect(player.getCurrentScale().notes).toEqual([0, 2, 3, 5, 7, 9, 10]);
    });

    it('snapshots and restores the collapse mode', () => {
        const player = createPlayer();
        player.collapse = 'LOW_HIGH';

        const snapshot = player.snapshotPresetState();
        player.collapse = 'NONE';
        player.restorePresetState(snapshot);

        expect(player.collapse).toBe('LOW_HIGH');
    });
});
