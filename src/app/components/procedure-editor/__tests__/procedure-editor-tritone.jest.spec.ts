import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const TEMPLATE = readFileSync(
  join(__dirname, '..', 'procedure-editor.component.html'),
  'utf8'
);

describe('procedure editor tritone operations', () => {
  it('shows the variable control only for variable operations', () => {
    expect(TEMPLATE).toContain('@if (showsVariable(operation.type)) {');
  });

  it('renders a keep-position input for ADD/REMOVE TRITONE', () => {
    expect(TEMPLATE).toContain(
      "operation.type === 'ADD_TRITONE' || operation.type === 'REMOVE_TRITONE'"
    );
    expect(TEMPLATE).toContain('[(ngModel)]="operation.keepPosition"');
    expect(TEMPLATE).toContain('aria-label="Keep position"');
  });

  it('renders the invert hint', () => {
    expect(TEMPLATE).toContain("operation.type === 'INVERT_TRITONE'");
    expect(TEMPLATE).toContain('KEY + 6');
  });
});
