# Modernización a Angular 21 y Node 22

- **Fecha:** 2026-11-01
- **Autor:** DANI (coordinación y arquitectura)
- **Estado:** implementado en la rama `feature/angular-21-modernization`
- **Alcance:** actualizar el stack sin cambiar el comportamiento de `.mr`, del
  reproductor ni de la GUI. ANTLR queda fuera de este trabajo.

---

## 1. Punto de partida

Antes del cambio:

- Angular 13.1
- TypeScript 4.5.5
- Node 16.20.2
- PrimeNG 13.4
- Jest 29
- `@types/node` 12

Angular 13 y Node 16 estaban fuera de soporte. La actualización no era solo
una cuestión de versiones: el build, los tests, el tema de PrimeNG y los tipos
de Node también dependían de ese stack.

## 2. Versiones objetivo

| Pieza | Versión |
|---|---|
| Node | 22.23.3 (LTS) |
| Angular / CLI | 21.2.25 / 21.2.29 |
| TypeScript | 5.9.3 |
| PrimeNG | 21.1.10 |
| `@primeuix/themes` | 2.0.3 |
| `@angular/cdk` | 21.2.14 |
| PrimeIcons / PrimeFlex | 8.0.2 / 4.0.0 |
| Jest / `@types/jest` | 30.5.2 / 30.0.0 |
| `@types/node` | 22.20.5 |

La app declara `engines.node >= 22.12.0` y `.nvmrc` apunta a Node 22.

## 3. Proceso

La actualización se hizo salto a salto, con `ng update`, y con tests + build
verdes en cada paso:

1. Angular 13 → 14. TypeScript 4.8; migración del workspace.
2. Angular 14 → 15. TypeScript 4.8; target ES2022; se corrigió el import CSS
   con `~` que Angular 15 ya no resuelve.
3. Angular 15 → 16. TypeScript 5.1; se corrigió `typeRoots` para que los
   paquetes CommonJS encontrasen `@types/node`.
4. Angular 16 → 17. TypeScript 5.4; el build pasa a Node 22.
5. Angular 17 → 18. TypeScript 5.4; se mantiene el builder webpack.
6. Angular 18 → 19. TypeScript 5.8; la migración añade `standalone: false` a
   los componentes NgModule.
7. Angular 19 → 20. TypeScript 5.8; `moduleResolution: bundler` en la app y
   `node` en los paquetes CommonJS (`packages/core`, `packages/compiler`).
8. Angular 20 → 21. TypeScript 5.9, Jest 30, zone.js 0.15; PrimeNG 21,
   `@primeuix/themes` y limpieza de imports CSS antiguos.

## 4. Cambios funcionales y de toolchain

- `src/main.ts` usa `provideZoneChangeDetection()` en el bootstrap del
  `app.config.ts`.
- Se retiró `@angular/animations`/`provideAnimations()`: la app y PrimeNG 21 no
  lo necesitan. El tema de PrimeNG se importa de `@primeuix/themes`.
- `tsconfig.json` compila a ES2022 y usa `moduleResolution: bundler`.
- `packages/core` y `packages/compiler` fuerzan `moduleResolution: node` porque
  son CommonJS.
- `@types/node` y `@types/jest` se alinean con Node 22 y Jest 30.
- CI, release y `scripts/dev.sh` usan Node 22.
- Se añadió `.nvmrc`.

### PrimeNG 21

- Se sustituye el tema CSS antiguo por `providePrimeNG({ theme: { preset: Aura } })`
  en `app.config.ts`.
- Se eliminan `primeng/resources/themes/*` y `primeng.min.css` de
  `angular.json` y `styles.css`.
- `p-sidebar` pasa a `p-drawer`; `SidebarModule` pasa a `DrawerModule`.
- Se retiran `DropdownModule` y `InputTextareaModule`, que ya no se usaban en
  las plantillas.
- El evento `onNodeDrop` de `p-tree` acepta `TreeNodeDropEvent` y se adapta al
  tipo interno de bloques.
- El árbol de PrimeNG 21 cambia sus clases internas (`p-treenode-*` →
  `p-tree-node-*`) y aplica la indentación con `padding-left` inline. Se
  migraron los selectores y se retiró el `height: 14px` que recortaba el
  contenido del bloque; sin ese ajuste, las filas de comandos se solapaban.
- PrimeIcons 8 y PrimeFlex 4 sustituyen a las versiones 5 y 3.

### Decisiones deliberadas

- **Standalone.** La migración se hizo en dos fases: primero el arranque
  (`bootstrapApplication` + `app.config.ts`, manteniendo `EditorModule`) y
  después todos los componentes. `EditorModule` se eliminó y `AppComponent`
  importa directamente `SongEditorComponent`.
- **Application builder.** La migración se completó después en
  `feature/application-builder`: el build usa `@angular/build:application`
  (esbuild/Vite) y la salida de producción está en
  `dist/moderanger/browser`.
- **Control flow.** La migración automática a `@if`/`@for` se revirtió en la
  PR de toolchain para no mezclarla con una reescritura de plantillas. Se
  completó después en `feature/control-flow`, actualizando los tests de
  contrato de template.
- **No se toca `.mr` ni el parser.** El núcleo y sus 933 tests siguen igual.

## 5. Validación

- `npm test`: 90 suites / 933 tests.
- `npm run test:cov`: umbrales correctos.
- `npm run build`: app + CLI.
- `npm ci` limpio con Node 22.
- Smoke visual con Firefox headless: shell, toolbar, panel de Parts, árbol de
  bloques, Help en `p-drawer` y demo cargada. El árbol y el drawer se pintan
  correctamente tras migrar las clases de PrimeNG 21.
- Application builder: `ng serve` con Vite y build de producción correctos;
  salida en `dist/moderanger/browser`.
- CI: pendiente de ejecutar en la PR.

## 6. Pendientes y riesgos

1. **QA visual de PrimeNG 21.** El tema Aura y PrimeFlex 4 pueden cambiar
   espaciados, colores, iconos y estados de foco. Hay que revisar la app real,
   especialmente árbol, drawer de ayuda, diálogos, inputs y botones.
2. **QA de audio.** El cambio de stack no debería afectar a Tone.js, pero hay
   que probar reproducción, metrónomo, BPM y parada.
3. **Templates legacy.** ✅ **Resuelto (2026-11-02, `feature/control-flow`):**
   las plantillas usan `@if`/`@for`/`@switch`; los tests de contrato se
   actualizaron.
4. **Builder.** ✅ **Resuelto (2026-11-02, `feature/application-builder`):**
   migrado a `@angular/build:application`; build de ~12 s y salida en
   `dist/moderanger/browser`.
5. **Standalone / bootstrap.** ✅ **Resuelto (2026-11-02,
   `feature/standalone-components`):** todos los componentes son standalone,
   `EditorModule` se eliminó y el árbol se importa explícitamente desde cada
   componente. Los mocks de Jest cubren Angular Common/Forms y PrimeNG.
6. **Dependencias.** ✅ **Triaje hecho (2026-11-01,
   `fix/npm-audit`):** 0 críticos, 0 altos y 0 en producción; quedan avisos
   moderados/bajos de toolchain de desarrollo.
7. **Deprecaciones.** ✅ **Resuelto (2026-11-02,
   `feature/deprecation-cleanup`):** sin `@angular/animations` y con
   `@primeuix/themes` en lugar de `@primeng/themes`.
