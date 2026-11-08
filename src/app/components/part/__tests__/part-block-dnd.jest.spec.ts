/**
 * Contrato de drag & drop de bloques raíz (Angular CDK).
 *
 * El movimiento de datos se prueba en `parts-layout.jest.spec.ts`; aquí se
 * fija que la plantilla conecte CDK y que el asa raíz no active el drag de
 * PrimeNG de los hijos.
 */
import * as fs from 'fs';
import * as path from 'path';

const read = (relative: string): string => fs.readFileSync(path.resolve(__dirname, relative), 'utf8');
const partTemplate = read('../part.component.html');
const partsTemplate = read('../../parts/parts.component.html');
const blockTemplate = read('../../block/block.component.html');
const blockStyles = read('../../block/block.component.scss');
const styles = read('../../../../styles.css');

describe('bloques raíz · drag & drop con CDK', () => {
    it('conecta todas las parts en un grupo de drop lists', () => {
        expect(partsTemplate).toContain('cdkDropListGroup');
    });

    it('declara la lista de bloques de la part y el drop de CDK', () => {
        expect(partTemplate).toContain('cdkDropList');
        expect(partTemplate).toContain('[cdkDropListData]="part.items"');
        expect(partTemplate).toContain('(cdkDropListDropped)="onBlockDrop($event)"');
    });

    it('hace arrastrables los bloques raíz y conserva el estado del tooltip', () => {
        expect(partTemplate).toContain('cdkDrag');
        expect(partTemplate).toContain('[rootDraggable]="true"');
        expect(partTemplate).toContain('[rootDragging]="draggedRootBlockId === block.id"');
        expect(partTemplate).toContain('(cdkDragStarted)="onRootDragStarted(block)"');
        expect(partTemplate).toContain('(cdkDragEnded)="onRootDragEnded()"');
    });

    it('muestra un asa CDK separada del asa PrimeNG de los hijos', () => {
        expect(blockTemplate).toContain('block-root-drag-handle');
        expect(blockTemplate).toContain('cdkDragHandle');
        expect(blockTemplate).toContain('draggable="false"');
        expect(blockTemplate).toContain('[tooltipDisabled]="rootDragging"');
        // El asa hija mantiene su clase y su drag de PrimeNG.
        expect(blockTemplate).toContain('block-drag-handle');
    });

    it('da el mismo aspecto a ambas asas', () => {
        expect(blockStyles).toContain('.block-drag-handle,\n.block-root-drag-handle');
        expect(blockStyles).toContain('cursor: grab');
        expect(blockStyles).toContain('cursor: grabbing');
    });

    it('estiliza el preview y el hueco de CDK en el stylesheet global', () => {
        expect(styles).toContain('.cdk-drag-preview');
        expect(styles).toContain('.cdk-drag-placeholder');
        expect(styles).toContain('.cdk-drag-animating');
    });
});
