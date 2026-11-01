# Auditoría de dependencias npm (2026-11)

- **Fecha:** 2026-11-01
- **Autor:** DANI (coordinación y arquitectura)
- **Estado:** triaje completado; avisos restantes son de toolchain de desarrollo
- **Rama:** `fix/npm-audit`

---

## 1. Punto de partida

`npm audit` sobre `develop` (Angular 21 / Node 22) devolvía:

| Severidad | Avisos |
|---|---:|
| Crítico | 1 |
| Alto | 5 |
| Moderado | 37 |
| Bajo | 3 |
| **Total** | **46** |

La auditoría de producción era limpia:

```sh
npm audit --omit=dev
# 0 vulnerabilidades
```

Es decir: el código que se sirve al navegador no tenía avisos. Los 46 avisos
estaban en dependencias de desarrollo, test o build.

## 2. Hallazgos principales

- **Crítico: `handlebars`**, transitiva de `ts-jest`. La versión instalada
  (`4.7.9`) estaba afectada por inyección de JavaScript. `ts-jest@29.4.15`
  actualiza a `handlebars@4.7.10`, que corrige el aviso.
- **Alto: `lodash`**, transitiva de `ts-prune`. `ts-prune` no se usa en scripts,
  CI ni código: se elimina.
- **Alto: `minimatch` / `brace-expansion` / `glob`**, en cadenas de `rimraf`,
  `ts-prune` y Jest. `rimraf` tampoco se usa: se elimina.
- **Alto: `fast-uri`**, transitiva de `ajv` dentro de Angular CLI/build. Se fija
  con un override compatible (`3.1.9`).
- **Alto: `picomatch` 2.x**, transitiva de `chokidar`/`micromatch` dentro de
  webpack-dev-server. Se fija con overrides acotados (`2.3.2`); no se toca la
  4.x que usa Angular.
- **Moderados restantes:** cadenas de `@angular/cli`/`pacote`, Jest/ts-jest,
  `webpack-dev-server`/`sockjs` y utilidades de cobertura. Son dependencias de
  desarrollo y la corrección disponible exige Angular 22 o una actualización
  mayor coordinada.

## 3. Cambios aplicados

- `ts-jest` 29.4.14 → 29.4.15.
- Eliminados `ts-prune` y `rimraf` (no tienen usos en el repositorio).
- Overrides en `package.json`:
  - `fast-uri`: `3.1.9`.
  - `micromatch` → `picomatch`: `2.3.2`.
  - `chokidar` → `picomatch`: `2.3.2`.

No se aplicó `npm audit fix --force`: habría propuesto cambios mayores
(Angular 22, TypeScript 6, downgrades extraños de Jest) y no es aceptable
mezclarlos con esta limpieza.

## 4. Resultado

| Severidad | Antes | Después |
|---|---:|---:|
| Crítico | 1 | **0** |
| Alto | 5 | **0** |
| Moderado | 37 | 36 |
| Bajo | 3 | 3 |
| **Total** | **46** | **39** |
| Producción | 0 | **0** |

Los 39 avisos restantes son de toolchain de desarrollo. No hay avisos críticos,
altos ni de producción.

## 5. Validación

- `npm ci` limpio con Node 22.
- `npm test`: 90 suites / 933 tests.
- `npm run test:cov`: umbrales correctos.
- `npm run build`: app + CLI.
- `npm audit --omit=dev`: 0 vulnerabilidades.

## 6. Follow-ups

- Reevaluar al migrar a Angular 22: `@angular/cli` y
  `@angular-devkit/build-angular` corrigen sus cadenas en 22.2.5.
- La migración al application builder elimina `webpack-dev-server`/`sockjs` de
  la cadena de desarrollo.
- Revisar los overrides cuando Angular/Jest actualicen sus dependencias; no
  deben quedarse como deuda permanente.
- `@primeng/themes` está deprecado; migrar a `@primeuix/themes` en una tarea
  separada.
- `@angular/platform-browser-dynamic` ya no se usa tras el bootstrap
  standalone; `@angular/animations` sigue deprecado y queda en el follow-up de
  animations.

## 7. Actualización posterior: application builder

Tras migrar el build a `@angular/build:application`, la cadena de
`webpack-dev-server`/`sockjs` desaparece del árbol. La auditoría queda en
**34 avisos** (31 moderados, 3 bajos), sin críticos ni altos y con producción
en 0. La causa restante es Angular CLI/pacote, Jest/ts-jest y utilidades de
cobertura.
