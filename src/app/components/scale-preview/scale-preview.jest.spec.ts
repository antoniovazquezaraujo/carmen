import { ScalePreviewComponent } from './scale-preview.component';

function degrees(scale: string): number[] {
  const component = new ScalePreviewComponent();
  component.scale = scale;
  return component.cells.flat().filter((value): value is number => value !== null);
}

describe('ScalePreviewComponent', () => {
  it('distribuye los grados alrededor de la rejilla de 12 celdas', () => {
    const component = new ScalePreviewComponent();
    component.scale = 'WHITE';

    expect(component.cells).toEqual([
      [4, null, 5],
      [null, null, null],
      [3, null, 6],
      [2, null, 7],
      [null, 1, null]
    ]);
  });

  it('mantiene todos los grados de cada escala', () => {
    expect(degrees('WHITE')).toEqual([4, 5, 3, 6, 2, 7, 1]);
    expect(degrees('BLUE')).toEqual([4, 5, 3, 6, 2, 7, 1]);
    expect(degrees('RED')).toEqual([4, 5, 3, 6, 2, 1, 7]);
    expect(degrees('BLACK')).toEqual([4, 5, 3, 6, 2, 7, 1, 8]);
    expect(degrees('TONES')).toEqual([4, 3, 5, 2, 6, 1]);
    expect(degrees('FULL')).toEqual([6, 7, 8, 5, 9, 4, 10, 3, 11, 2, 1, 12]);
  });

  it('marca los grados ocultos de una vista COLLAPSE', () => {
    const component = new ScalePreviewComponent();
    component.scale = 'WHITE';
    component.collapseMode = 'LOW_HIGH';

    expect(component.hiddenNotes).toEqual([3, 9]);
    expect(component.isHidden(3)).toBe(true); // Eb
    expect(component.isHidden(6)).toBe(true); // A
    expect(component.isHidden(1)).toBe(false); // C
    expect(component.previewTitle).toBe('WHITE · LOW_HIGH');
    expect(component.ariaLabel).toContain('hidden semitones 3, 9');
  });

  it('no marca grados ocultos con COLLAPSE NONE', () => {
    const component = new ScalePreviewComponent();
    component.scale = 'WHITE';
    component.collapseMode = 'NONE';

    expect(component.hiddenNotes).toEqual([]);
    expect(component.isHidden(3)).toBe(false);
  });

  it('marca los grados ocultos de una vista RED', () => {
    const component = new ScalePreviewComponent();
    component.scale = 'RED';
    component.collapseMode = 'BOTH_LOW';

    expect(component.hiddenNotes).toEqual([1, 5, 8]);
    expect(component.isHidden(2)).toBe(true); // degree 2 = semitone 1
    expect(component.isHidden(4)).toBe(true); // degree 4 = semitone 5
    expect(component.isHidden(6)).toBe(true); // degree 6 = semitone 8
    expect(component.isHidden(1)).toBe(false);
    expect(component.isHidden(3)).toBe(false);
  });

  it('expone una etiqueta accesible con la escala y sus grados', () => {
    const component = new ScalePreviewComponent();
    component.scale = 'BLUE';

    expect(component.ariaLabel).toContain('BLUE scale');
    expect(component.ariaLabel).toContain('4, 5, 3, 6, 2, 7, 1');
  });
});
