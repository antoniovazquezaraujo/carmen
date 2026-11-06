import { ScalePreviewComponent } from './scale-preview.component';

function degrees(scale: string): number[] {
  const component = new ScalePreviewComponent();
  component.scale = scale;
  return component.cells.flat().filter((value): value is number => value !== null);
}

describe('ScalePreviewComponent', () => {
  it('distribuye los grados en la rejilla de dos columnas', () => {
    const component = new ScalePreviewComponent();
    component.scale = 'WHITE';

    expect(component.cells).toEqual([
      [4, 5],
      [3, 6],
      [2, 7],
      [1, null]
    ]);
  });

  it('mantiene todos los grados de cada escala', () => {
    expect(degrees('WHITE')).toEqual([4, 5, 3, 6, 2, 7, 1]);
    expect(degrees('BLACK')).toEqual([4, 5, 3, 6, 2, 7, 1, 8]);
    expect(degrees('PENTA')).toEqual([3, 4, 2, 5, 1]);
    expect(degrees('TONES')).toEqual([3, 4, 2, 5, 1, 6]);
    expect(degrees('FULL')).toEqual([6, 7, 5, 8, 4, 9, 3, 10, 2, 11, 1, 12]);
  });

  it('expone una etiqueta accesible con la escala y sus grados', () => {
    const component = new ScalePreviewComponent();
    component.scale = 'BLUE';

    expect(component.ariaLabel).toContain('BLUE scale');
    expect(component.ariaLabel).toContain('4, 5, 3, 6, 2, 7, 1');
  });
});
