import { createDemoSong, DEMO_SONG_MR } from '../demo-song';

describe('demo song', () => {
    it('es un .mr válido con dos parts, bibliotecas y contenido musical', () => {
        const song = createDemoSong();

        expect(DEMO_SONG_MR).toContain('song "First Light"');
        expect(song.name).toBe('First Light');
        expect(song.parts).toHaveLength(2);
        expect(song.parts[0].name).toBe('Piano');
        expect(song.parts[0].items.length).toBeGreaterThan(0);
        expect(song.parts[1].name).toBe('Bass');
        expect(song.melodies.map(melody => melody.label)).toEqual(['Bassline', 'Theme', 'Answer']);
        expect(song.presets.map(preset => preset.label)).toEqual(['BassAjustes', 'ThemeAjustes', 'AnswerAjustes']);
        expect(song.parts[1].items[0].melody?.label).toBe('Bassline');
        expect(song.parts[0].items[0].melody?.label).toBe('Theme');
    });

    it('se puede cargar más de una vez sin compartir estado mutable', () => {
        const first = createDemoSong();
        const second = createDemoSong();

        expect(first).not.toBe(second);
        expect(first.parts[0]).not.toBe(second.parts[0]);
        expect(first.melodies[0]).not.toBe(second.melodies[0]);
    });
});
