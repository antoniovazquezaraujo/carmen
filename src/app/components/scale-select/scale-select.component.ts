import { Component, EventEmitter, HostListener, Input, Output } from '@angular/core';
import { ScalePreviewComponent } from '../scale-preview/scale-preview.component';

/**
 * Selector de escala con miniaturas en la lista. Sustituye al `<select>` nativo
 * para poder mostrar el gráfico de cada escala al pasar por las opciones.
 */
@Component({
    selector: 'app-scale-select',
    templateUrl: './scale-select.component.html',
    styleUrls: ['./scale-select.component.scss'],
    imports: [ScalePreviewComponent]
})
export class ScaleSelectComponent {
    @Input() value = 'WHITE';
    @Input() options: readonly string[] = [];
    @Output() valueChange = new EventEmitter<string>();

    open = false;
    hovered: string | null = null;

    toggle(event: MouseEvent): void {
        event.preventDefault();
        event.stopPropagation();
        this.open = !this.open;
        this.hovered = this.open ? this.value : null;
    }

    select(scale: string, event: MouseEvent): void {
        event.preventDefault();
        event.stopPropagation();
        this.value = scale;
        this.valueChange.emit(scale);
        this.open = false;
        this.hovered = null;
    }

    @HostListener('document:click')
    close(): void {
        this.open = false;
        this.hovered = null;
    }

    onKeydown(event: KeyboardEvent): void {
        if (event.key === 'Escape') {
            this.close();
            return;
        }
        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            if (!this.open) {
                this.open = true;
                this.hovered = this.value;
                event.preventDefault();
                return;
            }
            const index = this.hovered ? this.options.indexOf(this.hovered) : -1;
            const direction = event.key === 'ArrowDown' ? 1 : -1;
            const next = (index + direction + this.options.length) % this.options.length;
            this.hovered = this.options[next] ?? this.value;
            event.preventDefault();
        }
    }
}
