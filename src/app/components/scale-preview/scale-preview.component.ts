import { Component, Input } from '@angular/core';

/** Número de grados de cada escala (la GUI solo necesita el conteo). */
const SCALE_DEGREES: Record<string, number> = {
    WHITE: 7,
    BLUE: 7,
    RED: 7,
    BLACK: 8,
    PENTA: 5,
    TONES: 6,
    FULL: 12
};

/**
 * Miniatura de una escala para el popover del editor de presets.
 *
 * La disposición sigue el esquema de la guía: los grados se reparten en dos
 * columnas en zigzag (4 5 / 3 6 / 2 7 / 1). Las escalas de 5, 6, 8 y 12
 * grados usan la misma regla, añadiendo o quitando filas.
 */
@Component({
    selector: 'app-scale-preview',
    templateUrl: './scale-preview.component.html',
    styleUrls: ['./scale-preview.component.scss']
})
export class ScalePreviewComponent {
    @Input() scale = 'WHITE';

    get scaleName(): string {
        return this.scale || 'WHITE';
    }

    get cells(): ReadonlyArray<ReadonlyArray<number | null>> {
        const total = SCALE_DEGREES[this.scaleName] ?? 7;
        const rows = Math.ceil(total / 2);
        const result: Array<Array<number | null>> = [];
        for (let row = 0; row < rows; row++) {
            const left = rows - row;
            const right = rows + 1 + row;
            result.push([
                left >= 1 ? left : null,
                right <= total ? right : null
            ]);
        }
        return result;
    }

    get ariaLabel(): string {
        const degrees = this.cells
            .flat()
            .filter((value): value is number => value !== null)
            .join(', ');
        return `${this.scaleName} scale: degrees ${degrees}`;
    }
}
