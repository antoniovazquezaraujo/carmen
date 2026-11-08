/**
 * Stubs de runtime para Jest: los componentes importan directivas de
 * `@angular/cdk/drag-drop`, pero los specs no compilan plantillas Angular.
 */
export class CdkDrag {}
export class CdkDragHandle {}
export class CdkDropList {}
export class CdkDropListGroup {}

export function moveItemInArray<T>(items: T[], previousIndex: number, currentIndex: number): void {
    const [item] = items.splice(previousIndex, 1);
    items.splice(currentIndex, 0, item);
}

export function transferArrayItem<T>(
    source: T[],
    target: T[],
    previousIndex: number,
    currentIndex: number
): void {
    const [item] = source.splice(previousIndex, 1);
    target.splice(currentIndex, 0, item);
}
