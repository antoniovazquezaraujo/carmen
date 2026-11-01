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
| `@primeng/themes` | 21.0.4 |
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
   `@primeng/themes` y limpieza de imports CSS antiguos.

## 4. Cambios funcionales y de toolchain

- `src/main.ts` usa `provideZoneChangeDetection()` en el bootstrap del
  `AppModule`.
- `tsconfig.json` compila a ES2022 y usa `moduleResolution: bundler`.
- `packages/core` y `packages/compiler` fuerzan `moduleResolution: node` porque
  son CommonJS.
- `@types/node` y `@types/jest` se alinean con Node 22 y Jest 30.
- CI, release y `scripts/dev.sh` usan Node 22.
- Se añadió `.nvmrc`.

### PrimeNG 21

- Se sustituye el tema CSS antiguo por `providePrimeNG({ theme: { preset: Aura } })`
  en `AppModule`.
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

- **Se mantienen NgModules.** No se hace la migración a standalone en el mismo
  cambio.
- **Se mantiene el builder webpack.** La migración opcional al application
  builder de Angular queda como follow-up.
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
4. **Builder.** Migrar al application builder de Angular 21 y medir el bundle.
5. **Standalone / bootstrap.** Migrar NgModules a standalone y
   `platformBrowserDynamic` a `bootstrapApplication` es un proyecto aparte.
6. **Dependencias.** Revisar `npm audit`; los avisos restantes no bloquean el
   build, pero deben evaluarse.
