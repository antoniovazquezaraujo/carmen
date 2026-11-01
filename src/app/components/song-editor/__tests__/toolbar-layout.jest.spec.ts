/**
 * Toolbar de canción: todos los controles comparten altura y la vista de
 * texto usa un icono de hoja en lugar de la etiqueta `.mr`.
 */
import * as fs from 'fs';
import * as path from 'path';

const template = fs.readFileSync(path.resolve(__dirname, '../song-editor.component.html'), 'utf8');
const styles = fs.readFileSync(path.resolve(__dirname, '../song-editor.component.scss'), 'utf8');

describe('song-editor · toolbar uniforme', () => {
    it('nombre, Repeat, BPM, botones, duración y metrónomo comparten 30px', () => {
        expect(styles).toContain('.song-header .song-name-input,');
        expect(styles).toContain('.song-header .number-input,');
        expect(styles).toContain('.song-header .default-duration-select,');
        expect(styles).toContain('.song-header .playback-controls .p-button');
        expect(styles).toMatch(/\.song-header \.playback-controls #repetitions\s*\{[\s\S]*?height:\s*30px !important/);
        expect(styles).toMatch(/\.song-header \.playback-controls \.p-button\s*\{[\s\S]*?height:\s*30px !important/);
    });

    it('la vista de texto es un botón Source con el icono a la derecha', () => {
        expect(template).toContain('pi pi-file-o');
        expect(template).toContain('class="toolbar-label-button"');
        expect(template).toContain('<span>Source</span>');
        expect(template).toContain('pTooltip="Source (.mr)"');
        expect(template).toContain('aria-label="Source (.mr)"');
        expect(template).not.toContain('label=".mr"');
        expect(template).not.toContain('pi pi-code');
    });

    it('Load, Save y Examples llevan etiqueta visible junto al icono', () => {
        expect(template).toContain('<span>Load</span>');
        expect(template).toContain('<span>Save</span>');
        expect(template).toContain('<span>Examples</span>');
        expect(template).toContain('class="toolbar-label-button"');
        expect(template).toContain('(click)="toggleExamplesPanel()"');
    });

    it('la ayuda es visible y abre la guía contextual', () => {
        expect(template).toContain('pi pi-question-circle');
        expect(template).toContain('<span>Help</span>');
        expect(template).toContain('pTooltip="Help and quick guide"');
        expect(template).toContain('aria-label="Help and quick guide"');
        expect(template).toContain('aria-haspopup="dialog"');
        expect(template).toContain('[attr.aria-expanded]="helpVisible"');
        expect(template).toContain('<app-help-panel');
        expect(template).toContain('(loadDemo)="loadDemoSong()"');
    });

    it('no muestra el bloque de estado vacío de Parts', () => {
        expect(template).not.toContain('parts-empty-state');
        expect(template).not.toContain('Start with a part');
    });

    it('el botón .mr alterna el panel lateral fijo, no el diálogo', () => {
        expect(template).toContain('(click)="toggleMrTextPanel()"');
        expect(template).toContain('[attr.aria-expanded]="mrTextPanelVisible"');
        expect(template).toContain('aria-controls="mr-live-panel"');
        expect(template).toContain('<app-mr-live-panel');
        expect(template).toContain('*ngIf="mrTextPanelVisible"');
        expect(template).toContain('(edit)="openMrTextEditor()"');
        expect(template).toContain('[(visible)]="mrEditorVisible"');
    });

    it('los paneles de texto y ejemplos conviven y tienen splitter', () => {
        expect(template).toContain('*ngIf="examplesVisible"');
        expect(template).toContain('id="example-library-panel"');
        expect(template).toContain('<app-example-library');
        expect(template).toContain('(loadExample)="loadExample($event)"');
        expect(template).toContain('startPanelResize(\'text\', $event)');
        expect(template).toContain('startPanelResize(\'examples\', $event)');
        expect(template).toContain('[style.width.px]="mrTextPanelWidth"');
        expect(template).toContain('[style.width.px]="examplesPanelWidth"');
    });
});
