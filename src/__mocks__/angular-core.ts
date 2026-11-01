/**
 * Stub compartido de `@angular/core` para tests unitarios de Jest.
 *
 * El núcleo y los componentes usan decoradores de metadatos y tipos de Angular.
 * En Jest no arrancamos Angular/DI ni renderizamos plantillas, así que los
 * decoradores son no-ops y los tipos se conservan solo en compilación.
 */

export const Injectable = (): ClassDecorator => (target) => target;
export const Component = (): ClassDecorator => (target) => target;
export const Directive = (): ClassDecorator => (target) => target;
export const Pipe = (): ClassDecorator => (target) => target;
export const NgModule = (): ClassDecorator => (target) => target;

export const Inject = (_token?: unknown): ParameterDecorator => () => undefined;
export const Optional = (): ParameterDecorator => () => undefined;

const propertyDecorator = (): PropertyDecorator => () => undefined;
const methodDecorator = (): MethodDecorator => () => undefined;

export const Input = propertyDecorator;
export const Output = propertyDecorator;
export const ViewChild = propertyDecorator;
export const ViewChildren = propertyDecorator;
export const ContentChild = propertyDecorator;
export const ContentChildren = propertyDecorator;
export const HostBinding = propertyDecorator;
export const HostListener = methodDecorator;

export const ChangeDetectionStrategy = { OnPush: 0, Default: 1 };
export const ChangeDetectorRef = class {};
export const ElementRef = class {};
export const QueryList = class {};
export const ViewContainerRef = class {};
export const TemplateRef = class {};
export class InjectionToken<T> {
  constructor(public readonly description: string) {}
}
export const forwardRef = <T>(fn: () => T): (() => T) => fn;

export class EventEmitter<T> {
  private readonly listeners: Array<(value: T) => void> = [];

  subscribe(listener: (value: T) => void): { unsubscribe: () => void } {
    this.listeners.push(listener);
    return {
      unsubscribe: () => {
        const index = this.listeners.indexOf(listener);
        if (index >= 0) {
          this.listeners.splice(index, 1);
        }
      }
    };
  }

  emit(value: T): void {
    for (const listener of [...this.listeners]) {
      listener(value);
    }
  }
}
