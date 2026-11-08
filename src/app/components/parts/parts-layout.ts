/**
 * Reparto de anchos entre parts vecinas al arrastrar un splitter.
 *
 * Es lógica pura (sin DOM) para poder probarla en Jest: el componente mide
 * los anchos en px y delega aquí el cálculo del nuevo par (izquierda/derecha).
 */
import type { Block } from 'src/app/model/block';
import type { Part } from 'src/app/model/part';

/** Ancho mínimo de una part (sincronizado con `min-width` en CSS). */
export const MIN_PART_WIDTH = 260;

/** Paso de teclado (flechas ←/→) sobre el splitter. */
export const KEYBOARD_RESIZE_STEP = 20;

/**
 * Aplica el desplazamiento `delta` al borde entre dos parts.
 *
 * Mientras la part que decrece no toca su mínimo, la suma se mantiene (una
 * crece y la otra decrece). Cuando la que decrece llega a `minWidth`, se queda
 * ahí y la que crece **sigue creciendo sin tope**: la fila aumenta de ancho y
 * aparece/crece el scroll horizontal del contenedor.
 *
 * La part que se encoge nunca baja de `minWidth`; el resultado es lineal (el
 * borde sigue al puntero, sin saltos) y simétrico en ambos sentidos.
 *
 * @param left  Ancho actual de la part izquierda (px).
 * @param right Ancho actual de la part derecha (px).
 * @param delta Desplazamiento horizontal del puntero (px).
 * @param minWidth Mínimo por part (por defecto `MIN_PART_WIDTH`).
 */
export function clampBoundary(
    left: number,
    right: number,
    delta: number,
    minWidth: number = MIN_PART_WIDTH
): { left: number; right: number } {
    return {
        left: Math.round(Math.max(minWidth, left + delta)),
        right: Math.round(Math.max(minWidth, right - delta))
    };
}

/** Mueve un bloque dentro de la misma lista de una part. */
export function moveBlockWithin<T>(items: T[], previousIndex: number, currentIndex: number): void {
    if (previousIndex === currentIndex) {
        return;
    }
    const [moved] = items.splice(previousIndex, 1);
    items.splice(currentIndex, 0, moved);
}

/** Mueve un bloque de la lista de una part a la de otra. */
export function moveBlockBetween<T>(
    source: T[],
    target: T[],
    previousIndex: number,
    currentIndex: number
): void {
    const [moved] = source.splice(previousIndex, 1);
    target.splice(currentIndex, 0, moved);
}

/** `true` si `target` es el propio bloque o uno de sus descendientes. */
export function containsBlock(root: Block, target: Block): boolean {
    return root === target || root.children.some(child => containsBlock(child, target));
}

/** Busca un bloque por id en todas las parts, incluidos los descendientes. */
export function findBlockById(parts: readonly Part[], id: number): Block | null {
    const findInBlocks = (blocks: readonly Block[]): Block | null => {
        for (const block of blocks) {
            if (block.id === id) {
                return block;
            }
            const nested = findInBlocks(block.children);
            if (nested) {
                return nested;
            }
        }
        return null;
    };

    for (const part of parts) {
        const found = findInBlocks(part.items);
        if (found) {
            return found;
        }
    }
    return null;
}
