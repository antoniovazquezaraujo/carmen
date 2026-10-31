import { VariableContext } from '../variable.context';
import { createExampleSong, EXAMPLE_SONGS } from '../examples';

describe('example song library', () => {
    beforeEach(() => {
        VariableContext.context.clear();
    });

    afterEach(() => {
        VariableContext.context.clear();
    });

    it('contiene diez ejemplos con identificadores únicos', () => {
        expect(EXAMPLE_SONGS).toHaveLength(10);
        const ids = EXAMPLE_SONGS.map(example => example.id);
        expect(new Set(ids).size).toBe(ids.length);
    });

    it('todos los ejemplos son .mr válidos', () => {
        for (const example of EXAMPLE_SONGS) {
            expect(() => createExampleSong(example)).not.toThrow();
            expect(createExampleSong(example).name).toBeTruthy();
        }
    });

    it('aplica las variables declaradas por el ejemplo', () => {
        const dodecaedro = EXAMPLE_SONGS.find(example => example.id === 'dodecaedro');
        const glass = EXAMPLE_SONGS.find(example => example.id === 'glass-orbit');
        expect(dodecaedro).toBeDefined();
        expect(glass).toBeDefined();

        createExampleSong(dodecaedro!);
        expect(VariableContext.getValue('v')).toBe('4 5 1');
        expect(VariableContext.getValue('x')).toBe('3 6 2');
        expect(VariableContext.getValue('b')).toBe('EVEN_ASC_ODD_DESC');

        createExampleSong(glass!);
        expect(VariableContext.getValue('oct')).toBe(3);
        expect(VariableContext.getValue('mode')).toBe('ASCENDING');
        expect(VariableContext.getValue('scale')).toBe('BLUE');
    });

    it('cada ejemplo tiene título, descripción y etiquetas', () => {
        for (const example of EXAMPLE_SONGS) {
            expect(example.title.trim()).not.toBe('');
            expect(example.description.trim()).not.toBe('');
            expect(example.tags.length).toBeGreaterThan(0);
            expect(example.bpm).toBeGreaterThanOrEqual(30);
            expect(example.bpm).toBeLessThanOrEqual(240);
        }
    });
});
