import { CommandType } from 'src/app/model/command';
import {
  commandTypeDescription,
  createShiftCommands,
  SHIFT_COMMAND_TYPES
} from '../command-ui';

describe('command-ui · descripciones y grupo Shift', () => {
  it('describe los ajustes y el grupo sintético Shift', () => {
    expect(commandTypeDescription(CommandType.OCT)).toContain('Octava');
    expect(commandTypeDescription(CommandType.PLAYMODE)).toContain('acorde');
    expect(commandTypeDescription('SHIFT')).toContain('Start, Size y Value');
    expect(commandTypeDescription('DESCONOCIDO')).toBe('Ajuste de reproducción.');
  });

  it('crea los tres ajustes Shift con valores neutros', () => {
    const commands = createShiftCommands();

    expect(commands.map(command => command.type)).toEqual(SHIFT_COMMAND_TYPES);
    expect(commands.map(command => command.value)).toEqual([0, 0, 0]);
  });
});
