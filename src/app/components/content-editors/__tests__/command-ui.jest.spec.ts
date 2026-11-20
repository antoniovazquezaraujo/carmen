import { CommandType } from 'src/app/model/command';
import {
  COLLAPSE_MODE_LABELS,
  commandTypeDescription,
  createShiftCommands,
  defaultCommandValue,
  SHIFT_COMMAND_TYPES
} from '../command-ui';

describe('command-ui · descripciones y grupo Shift', () => {
  it('describe los ajustes y el grupo sintético Shift', () => {
    expect(commandTypeDescription(CommandType.OCT)).toContain('octave');
    expect(commandTypeDescription(CommandType.OCTAVE_PATTERN)).toContain('octave offsets');
    expect(commandTypeDescription(CommandType.PLAYMODE)).toContain('chord');
    expect(commandTypeDescription(CommandType.COLLAPSE)).toContain('Scale view');
    expect(commandTypeDescription('SHIFT')).toContain('Start, Size and Value');
    expect(commandTypeDescription('UNKNOWN')).toBe('Playback setting.');
  });

  it('usa COLLAPSE NONE como valor por defecto', () => {
    expect(defaultCommandValue(CommandType.COLLAPSE, [], [])).toBe('NONE');
  });

  it('etiqueta los modos COLLAPSE para la GUI', () => {
    expect(COLLAPSE_MODE_LABELS['BOTH_HIGH']).toBe('Both high');
    expect(COLLAPSE_MODE_LABELS['LOW_HIGH']).toBe('Low / high');
    expect(COLLAPSE_MODE_LABELS['NONE']).toBe('None');
  });

  it('crea los tres ajustes Shift con valores neutros', () => {
    const commands = createShiftCommands();

    expect(commands.map(command => command.type)).toEqual(SHIFT_COMMAND_TYPES);
    expect(commands.map(command => command.value)).toEqual([0, 0, 0]);
  });
});
