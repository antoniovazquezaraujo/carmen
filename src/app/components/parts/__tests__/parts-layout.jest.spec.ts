/**
 * Lógica pura del splitter de parts: reparto, clamps y crecimiento sin tope.
 */
import { Block } from 'src/app/model/block';
import { Part } from 'src/app/model/part';
import {
    clampBoundary,
    containsBlock,
    findBlockById,
    KEYBOARD_RESIZE_STEP,
    MIN_PART_WIDTH,
    moveBlockBetween,
    moveBlockWithin
} from '../parts-layout';

describe('parts-layout · reparto de anchos', () => {
    it('mueve el borde la distancia pedida manteniendo la suma (sin topar mínimo)', () => {
        expect(clampBoundary(700, 700, 100)).toEqual({ left: 800, right: 600 });
        expect(clampBoundary(700, 700, -100)).toEqual({ left: 600, right: 800 });
        expect(clampBoundary(345, 345, 25)).toEqual({ left: 370, right: 320 });
    });

    it('la part que se encoge topa en el mínimo y la que crece sigue sin tope', () => {
        // Hacia la derecha: la derecha se queda en 260 y la izquierda sigue.
        expect(clampBoundary(700, 700, 10000)).toEqual({ left: 10700, right: MIN_PART_WIDTH });
        // Simétrico hacia la izquierda.
        expect(clampBoundary(700, 700, -10000)).toEqual({ left: MIN_PART_WIDTH, right: 10700 });
        // Crecimiento más allá del contenedor sin compensar la vecina.
        expect(clampBoundary(1300, 260, 200)).toEqual({ left: 1500, right: MIN_PART_WIDTH });
        expect(clampBoundary(260, 1300, -200)).toEqual({ left: MIN_PART_WIDTH, right: 1500 });
    });

    it('no da saltos: suma constante hasta el mínimo y luego crecimiento 1:1', () => {
        let state = { left: 500, right: 500 };
        // Primer tramo: la derecha baja de 500 a 260 (12 pasos de 20px).
        for (let i = 0; i < 12; i += 1) {
            state = clampBoundary(state.left, state.right, 20);
            expect(state.left).toBe(520 + i * 20);
            expect(state.left + state.right).toBe(1000);
        }
        expect(state).toEqual({ left: 740, right: MIN_PART_WIDTH });

        // A partir del mínimo solo crece la izquierda (la fila se ensancha).
        expect(clampBoundary(state.left, state.right, 20)).toEqual({ left: 760, right: MIN_PART_WIDTH });
        expect(clampBoundary(state.left, state.right, 40)).toEqual({ left: 780, right: MIN_PART_WIDTH });
    });

    it('el crecimiento es reversible con el mismo gesto (recalcula desde el inicio)', () => {
        const start = { left: 700, right: 700 };
        expect(clampBoundary(start.left, start.right, 500)).toEqual({ left: 1200, right: MIN_PART_WIDTH });
        expect(clampBoundary(start.left, start.right, 300)).toEqual({ left: 1000, right: 400 });
        expect(clampBoundary(start.left, start.right, 0)).toEqual({ left: 700, right: 700 });
        expect(clampBoundary(start.left, start.right, -300)).toEqual({ left: 400, right: 1000 });
    });

    it('desde el mínimo, crecer y encoger funcionan en ambos sentidos', () => {
        expect(clampBoundary(260, 260, 50)).toEqual({ left: 310, right: MIN_PART_WIDTH });
        expect(clampBoundary(260, 260, -50)).toEqual({ left: MIN_PART_WIDTH, right: 310 });
    });

    it('expone constantes coherentes con el contrato de UI', () => {
        expect(MIN_PART_WIDTH).toBe(260);
        expect(KEYBOARD_RESIZE_STEP).toBe(20);
    });
});

describe('parts-layout · movimiento de bloques raíz', () => {
    it('reordena dentro de la misma part', () => {
        const blocks = ['A', 'B', 'C'];

        moveBlockWithin(blocks, 0, 2);

        expect(blocks).toEqual(['B', 'C', 'A']);
    });

    it('no cambia nada si el índice de origen y destino coincide', () => {
        const blocks = ['A', 'B', 'C'];

        moveBlockWithin(blocks, 1, 1);

        expect(blocks).toEqual(['A', 'B', 'C']);
    });

    it('mueve un bloque de una part a otra en la posición indicada', () => {
        const source = ['A', 'B', 'C'];
        const target = ['D', 'E'];

        moveBlockBetween(source, target, 1, 1);

        expect(source).toEqual(['A', 'C']);
        expect(target).toEqual(['D', 'B', 'E']);
    });
});

describe('parts-layout · anidación de bloques', () => {
    it('detecta un bloque y sus descendientes, pero no a sus ancestros', () => {
        const root = new Block();
        const child = new Block();
        const grandchild = new Block();
        child.children = [grandchild];
        root.children = [child];

        expect(containsBlock(root, root)).toBe(true);
        expect(containsBlock(root, child)).toBe(true);
        expect(containsBlock(root, grandchild)).toBe(true);
        expect(containsBlock(child, root)).toBe(false);
    });

    it('encuentra un bloque anidado por id en cualquier part', () => {
        const firstRoot = new Block();
        const nested = new Block();
        firstRoot.children = [nested];
        const firstPart = new Part();
        firstPart.items = [firstRoot];

        const secondRoot = new Block();
        const secondPart = new Part();
        secondPart.items = [secondRoot];

        expect(findBlockById([firstPart, secondPart], nested.id)).toBe(nested);
        expect(findBlockById([firstPart, secondPart], secondRoot.id)).toBe(secondRoot);
        expect(findBlockById([firstPart, secondPart], -1)).toBeNull();
    });
});
