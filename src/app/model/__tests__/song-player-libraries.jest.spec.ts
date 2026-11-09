/**
 * Expansión de bloques estructurales con bibliotecas de contenido:
 * preset → procedure → melody → hijos, y repeticiones del bloque envolviendo
 * la pasada completa (ADR-004).
 */
import { AudioEngineService } from '../../services/audio-engine.service';
import { NoteGenerationService } from '../../services/note-generation.service';
import { NoteGenerationUnifiedService } from '../../shared/services/note-generation-unified.service';
import { GlobalStateService } from '../../shared/services/global-state.service';
import { Block } from '../block';
import { Melody, Preset, Procedure } from '../content';
import { Command, CommandType } from '../command';
import { Part } from '../part';
import { Song } from '../song';
import { SongPlayer } from '../song.player';
import { VariableContext } from '../variable.context';
import { VaryOperation } from '../operation';

interface EngineStub {
  engine: AudioEngineService;
  getLoopCallback(): (time: number) => void;
  triggerCalls(): unknown[][];
}

const createEngineStub = (): EngineStub => {
  let loopCallback: ((time: number) => void) | null = null;
  const triggerAttackRelease = jest.fn();
  const engine = {
    onTransportStop: jest.fn(() => 'stop-listener-1'),
    offTransportStop: jest.fn(),
    cancelTransportEvents: jest.fn(),
    stopTransport: jest.fn(),
    setTransportBpm: jest.fn(),
    setTransportPosition: jest.fn(),
    createInstrument: jest.fn(async () => 'instrument-1'),
    scheduleLoop: jest.fn((callback: (time: number) => void) => {
      loopCallback = callback;
      return 'loop-1';
    }),
    startLoop: jest.fn(),
    stopLoop: jest.fn(),
    disposeLoop: jest.fn(),
    startTransport: jest.fn(async () => undefined),
    triggerAttackRelease,
    midiToFrequency: jest.fn((note: number) => note),
    timeToSeconds: jest.fn(() => 0.05),
    getTransportTime: jest.fn(() => 0)
  } as unknown as AudioEngineService;
  return {
    engine,
    getLoopCallback: (): ((time: number) => void) => {
      if (!loopCallback) {
        throw new Error('scheduleLoop no se ha llamado todavía');
      }
      return loopCallback;
    },
    triggerCalls: (): unknown[][] => triggerAttackRelease.mock.calls
  };
};

const melody = (label: string, notes = '4n:0'): Melody => {
  const value = new Melody();
  value.label = label;
  value.content.notes = notes;
  return value;
};

const preset = (label: string, settings: Command[]): Preset => {
  const value = new Preset();
  value.label = label;
  value.settings = settings;
  return value;
};

const procedure = (label: string, operations: VaryOperation[]): Procedure => {
  const value = new Procedure();
  value.label = label;
  value.operations = operations;
  return value;
};

describe('SongPlayer · bibliotecas de contenido', () => {
  beforeEach(() => VariableContext.context.clear());

  it('expande preset → procedure → melody → hijos y repite la pasada completa', async () => {
    VariableContext.setValue('oct', 1);
    const stub = createEngineStub();
    const player = new SongPlayer(
      stub.engine,
      new NoteGenerationService(new NoteGenerationUnifiedService()),
      new GlobalStateService()
    );

    const song = new Song();
    const m = melody('M');
    song.melodies = [m];
    song.presets = [preset('P', [
      new Command({ type: CommandType.OCT, value: '$oct' }),
      new Command({ type: CommandType.PLAYMODE, value: 'SINGLE' })
    ])];
    song.procedures = [procedure('Proc', [new VaryOperation('oct', 1)])];

    const part = new Part();
    const block = new Block();
    block.label = 'B';
    block.repeatingTimes = 2;
    block.preset = song.presets[0];
    block.procedure = song.procedures[0];
    block.melody = m;
    const child = new Block();
    child.label = 'Hijo';
    child.melody = m;
    block.children = [child];
    part.items = [block];

    await player.playPart(part, song);
    const loop = stub.getLoopCallback();
    for (let tick = 0; tick < 20; tick++) {
      loop(tick * 0.05);
    }

    const frequencies = stub.triggerCalls().map(call => call[1] as number);
    expect(frequencies).toHaveLength(4);
    // Pasada 1: preset OCT 1 → melodía e hijo en octava 1; después la
    // operación sube $oct a 2. Pasada 2: el preset vuelve a leer la variable
    // (ya 2) y melodía e hijo suenan una octava más arriba.
    expect(frequencies).toEqual([48, 48, 60, 60]);
  });

  it('las operaciones del procedure se ejecutan en cada uso (VARY no se congela)', async () => {
    VariableContext.setValue('x', 0);
    const stub = createEngineStub();
    const player = new SongPlayer(
      stub.engine,
      new NoteGenerationService(new NoteGenerationUnifiedService()),
      new GlobalStateService()
    );

    const song = new Song();
    const m = melody('M');
    song.melodies = [m];
    song.procedures = [procedure('Proc', [new VaryOperation('x', 1)])];

    const part = new Part();
    const block = new Block();
    block.procedure = song.procedures[0];
    block.melody = m;

    const second = new Block();
    second.procedure = song.procedures[0];
    second.melody = m;
    part.items = [block, second];

    await player.playPart(part, song);

    expect(VariableContext.getValue('x')).toBe(2);
  });

  it('OCTAVE_PATTERN repite la melodía del bloque y deja intactos los hijos', async () => {
    const stub = createEngineStub();
    const player = new SongPlayer(
      stub.engine,
      new NoteGenerationService(new NoteGenerationUnifiedService()),
      new GlobalStateService()
    );

    const song = new Song();
    const melodyA = melody('A', '4n:0');
    const melodyB = melody('B', '4n:2');
    song.melodies = [melodyA, melodyB];
    song.presets = [
      preset('P', [
        new Command({ type: CommandType.OCT, value: 2 }),
        new Command({ type: CommandType.OCTAVE_PATTERN, value: '1 0' }),
        new Command({ type: CommandType.PLAYMODE, value: 'SINGLE' })
      ])
    ];

    const part = new Part();
    const blockA = new Block();
    blockA.label = 'A';
    blockA.preset = song.presets[0];
    blockA.melody = melodyA;
    const child = new Block();
    child.label = 'Hijo';
    child.melody = melodyB;
    blockA.children = [child];
    part.items = [blockA];

    await player.playPart(part, song);
    const loop = stub.getLoopCallback();
    for (let tick = 0; tick < 20; tick++) {
      loop(tick * 0.05);
    }

    expect(stub.triggerCalls().map(call => call[1])).toEqual([72, 60, 63]);
  });

  it('aplica INTENSITY_RAMP a las notas generadas del bloque', async () => {
    const stub = createEngineStub();
    const player = new SongPlayer(
      stub.engine,
      new NoteGenerationService(new NoteGenerationUnifiedService()),
      new GlobalStateService()
    );

    const song = new Song();
    const melodyRamp = melody('Ramp', '4n:0 4n:1 4n:2');
    song.melodies = [melodyRamp];
    song.presets = [
      preset('P', [
        new Command({ type: CommandType.PLAYMODE, value: 'SINGLE' }),
        new Command({ type: CommandType.INTENSITY_RAMP, value: '1 3 20 60' })
      ])
    ];

    const part = new Part();
    const block = new Block();
    block.label = 'Ramp';
    block.preset = song.presets[0];
    block.melody = melodyRamp;
    part.items = [block];

    await player.playPart(part, song);
    const loop = stub.getLoopCallback();
    for (let tick = 0; tick < 20; tick++) {
      loop(tick * 0.05);
    }

    expect(stub.triggerCalls().map(call => call[4])).toEqual([20 / 127, 40 / 127, 60 / 127]);
  });

  it('la velocity del preset solo afecta a su bloque, no a hijos ni hermanos', async () => {
    const stub = createEngineStub();
    const player = new SongPlayer(
      stub.engine,
      new NoteGenerationService(new NoteGenerationUnifiedService()),
      new GlobalStateService()
    );

    const song = new Song();
    const melodyA = melody('A');
    const melodyB = melody('B');
    song.melodies = [melodyA, melodyB];
    song.presets = [
      preset('P', [
        new Command({ type: CommandType.INTENSITY, value: 20 }),
        new Command({ type: CommandType.PLAYMODE, value: 'SINGLE' })
      ])
    ];

    const part = new Part();
    const blockA = new Block();
    blockA.label = 'A';
    blockA.preset = song.presets[0];
    blockA.melody = melodyA;
    const child = new Block();
    child.label = 'Hijo';
    child.melody = melodyA;
    blockA.children = [child];
    const blockB = new Block();
    blockB.label = 'B';
    blockB.melody = melodyB;
    part.items = [blockA, blockB];

    await player.playPart(part, song);
    const loop = stub.getLoopCallback();
    for (let tick = 0; tick < 20; tick++) {
      loop(tick * 0.05);
    }

    const velocities = stub.triggerCalls().map(call => call[4]);
    expect(velocities).toEqual([20 / 127, 90 / 127, 90 / 127]);
  });
});
