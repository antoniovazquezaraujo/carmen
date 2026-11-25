import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ConnectedPosition, OverlayModule } from '@angular/cdk/overlay';
import { Scale } from 'src/app/model/scale';
import { canApplyCollapse, CollapseMode } from 'src/app/model/scale-view';
import { ScalePreviewComponent } from '../scale-preview/scale-preview.component';

/**
 * Selector de escala con miniaturas en la lista. Sustituye al `<select>` nativo
 * para poder mostrar el gráfico de cada escala al pasar por las opciones.
 *
 * La lista se renderiza en un overlay de CDK para que no la recorten los
 * paneles con `overflow: hidden` ni quede debajo de los bloques siguientes.
 */
@Component({
    selector: 'app-scale-select',
    templateUrl: './scale-select.component.html',
    styleUrls: ['./scale-select.component.scss'],
    imports: [OverlayModule, ScalePreviewComponent]
})
export class ScaleSelectComponent {
    @Input() value = 'WHITE';
    @Input() options: readonly string[] = [];
    /** `scale` renders a scale preview; `collapse` renders the view on a parent. */
    @Input() kind: 'scale' | 'collapse' = 'scale';
    @Input() parentScale = 'WHITE';
    /** Optional display labels keyed by option value. */
    @Input() labels: Readonly<Record<string, string>> = {};
    @Output() valueChange = new EventEmitter<string>();

    labelFor(value: string): string {
        return this.labels[value] ?? value;
    }

    /** Collapse options are filtered by the parent scale; scale options are not. */
    get availableOptions(): readonly string[] {
        if (this.kind !== 'collapse') {
            return this.options;
        }
        const parentNotes = Scale.getScaleByName(this.parentScale).notes;
        return this.options.filter(option =>
            option === 'NONE' ||
            canApplyCollapse(parentNotes, option as CollapseMode)
        );
    }

    /** Keeps the trigger valid when the current value is not available for the parent. */
    get displayValue(): string {
        return this.availableOptions.includes(this.value)
            ? this.value
            : (this.availableOptions[0] ?? this.value);
    }

    get triggerAriaLabel(): string {
        return this.kind === 'collapse'
            ? `Collapse view: ${this.labelFor(this.displayValue)}`
            : `Scale: ${this.labelFor(this.displayValue)}`;
    }

    get listAriaLabel(): string {
        return this.kind === 'collapse' ? 'Collapse views' : 'Scales';
    }

    readonly overlayPositions: ConnectedPosition[] = [
        {
            originX: 'start',
            originY: 'bottom',
            overlayX: 'start',
            overlayY: 'top',
            offsetY: 2
        },
        {
            originX: 'start',
            originY: 'top',
            overlayX: 'start',
            overlayY: 'bottom',
            offsetY: -2
        }
    ];

    open = false;
    hovered: string | null = null;

    toggle(event: MouseEvent): void {
        event.preventDefault();
        event.stopPropagation();
        this.open = !this.open;
        this.hovered = this.open ? this.displayValue : null;
    }

    select(scale: string, event?: Event): void {
        event?.preventDefault();
        event?.stopPropagation();
        this.value = scale;
        this.valueChange.emit(scale);
        this.close();
    }

    close(): void {
        this.open = false;
        this.hovered = null;
    }

    onKeydown(event: KeyboardEvent): void {
        if (event.key === 'Escape') {
            this.close();
            return;
        }
        if (event.key === 'Tab') {
            this.close();
            return;
        }
        if (event.key === 'Enter' && this.open && this.hovered) {
            this.select(this.hovered);
            event.preventDefault();
            return;
        }
        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            if (!this.open) {
                this.open = true;
                this.hovered = this.displayValue;
                event.preventDefault();
                return;
            }
            const index = this.hovered ? this.availableOptions.indexOf(this.hovered) : -1;
            const direction = event.key === 'ArrowDown' ? 1 : -1;
            const next = (index + direction + this.availableOptions.length) % this.availableOptions.length;
            this.hovered = this.options[next] ?? this.displayValue;
            event.preventDefault();
        }
    }
}
