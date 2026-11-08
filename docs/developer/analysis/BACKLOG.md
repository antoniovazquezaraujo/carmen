# 📋 Backlog de Carmen

- **Actualizado:** 2026-11-08
- **Estado:** **v1.0.0 publicada** (2026-11-08). `develop` es la rama de integración y `main` refleja la release.
- **Contexto:** las bibliotecas de contenido (`.mr` v2) sustituyen a los bloques reutilizables; la base está en Angular 21 / Node 22 y el CLI MIDI ya está integrado.
- **Uso:** este documento resume el roadmap. Los bugs y propuestas concretas viven preferentemente como issues de GitHub; aquí se decide qué entra, en qué orden y qué queda aparcado.

## Prioridades abiertas

| # | Tema | Detalle | Esf. | Riesgo | Referencia |
|---|---|---|---|---|---|
| 1 | **Bug #121: las variables saltan al iniciar Play** | Las operaciones `VARY`/`ASSIGN` se aplican al construir la reproducción, no en su posición musical; el sidebar muestra el valor final desde el primer instante. Hay que decidir entre aplicación posicional o actualización visible diferida. | M | Medio | [#121](https://github.com/antoniovazquezaraujo/carmen/issues/121) |
| 2 | **Publicar el CLI en npm** | `carmen-core` y `carmen-cli` siguen en `0.0.0` y no están publicados. Los tarballs se generan bien con `npm pack --dry-run`; falta la publicación manual con 2FA y el smoke test global. | S | Medio | `docs/developer/release/Release_Process.md` §4, `compilador-midi-mvp.md` |
| 3 | **Expansión de melodías variables** | Una `$variable` string (`$motif = "4t:0"`) debería expandirse en reproducción como secuencia de eventos; hoy se sustituye por un silencio de su duración. Definir semántica de duración/reemplazo y el caso de grupos. | M | Medio | `pulido-bpm-variables.md` §8.3 |
| 4 | **Instrumentos adicionales** | Ampliar `InstrumentType` (pads, órgano, bajo, campanas… y/o samplers), factoría tipo→Tone reutilizando instancias y selector de instrumento por parte en la GUI. | S/M | Bajo | [#14](https://github.com/antoniovazquezaraujo/carmen/issues/14), `audio-engine.service.ts` |
| 5 | **Percusión (MVP: kit por grados)** | `instrument DRUMS` con mapa grado → pieza (bombo, caja, charles, toms, crash…), sintetizado con Tone y sin samples. Decidir si `PLAYMODE`/`PATTERN` aplican o se ignoran. | M | Medio | Conversación 2026-10-05 |
| 6 | **Mezcla por parte** | Volumen, paneo y envolventes (ADSR) por parte. Prácticamente imprescindible si entra la percusión. | S | Bajo | Conversación 2026-10-05 |
| 7 | **Mejoras UX de content libraries** | Navegación de usos en ambos sentidos (chip `×N` → bloques), buscador/filtro, duplicar-y-reasignar desde un bloque, importar/exportar entradas y audición individual. | S/M | Bajo | Conversación 2026-11-08 |
| 8 | **Edición visual de intensidad** | Lane/controles para intensidad por nota, rampas y patrones sin editar `.mr`; hoy el perfil se configura en los ajustes del preset y `@` se escribe en el texto. | S/M | Bajo | Conversación 2026-11-08 |
| 9 | **Repeticiones con primera/última pasada** | Añadir semántica de primera vez / última vez en las repeticiones de canción o bloque. | S | Bajo | [#8](https://github.com/antoniovazquezaraujo/carmen/issues/8) |
| 10 | **Paridad de repeticiones de canción** | `main` recicla la secuencia extraída en las repeticiones; una rama archivada la reprocesaba. Ajuste pequeño si el producto lo pide. | S | Bajo | `docs/developer/audits/ramas-pendientes-vs-main.md` |
| 11 | **Follow-ups de dependencias** | Reevaluar los overrides de `package-lock.json` y los avisos de Angular al migrar a Angular 22; no deben quedarse como deuda permanente. | S | Bajo | `npm-audit-2026-11.md` §6 |

## Aparcado

| # | Tema | Detalle | Referencia |
|---|---|---|---|
| A | **Modo live / hot-swap** | Cambios audibles sin parar ni reiniciar (bucle + Aplicar, edición GUI en vivo, swap al siguiente compás, live coding). No se aborda por ahora (decisión 2026-10-05). | Conversación 2026-10-05 |
| B | **CLI de escritorio con audio** | Cliente que tome `.mr` y suene sin navegador: MIDI + FluidSynth, render WAV offline, Electron o headless Chrome. El CLI MIDI actual ya compila sin navegador; falta la parte de audio. Aparcado. | Conversación 2026-10-05 |

## Completado recientemente

- **Rebranding visible** (2026-11-08): producto, app, README y docs pasan a **Carmen**; repo y Pages en `antoniovazquezaraujo/carmen`. Se mantienen `.mr`, `--mr-*` y los nombres temporales de CLI/paquetes.
- **v1.0.0** (2026-11-08): primera release pública, ZIP web adjunto y workflow de release corregido; la protección de `main` exige ya el check de Node 22.
- **Content libraries / `.mr` v2** (#142, ADR-004): `melodies`, `presets` y `procedures` reutilizables; bloques estructurales que referencian como máximo una entrada de cada tipo. Los PRs #139 y #140 (referencias anidadas con `use`) se cerraron por quedar sustituidos.
- **Duraciones de compás** (2026-11-08): `1m`, `2m`… funcionan en SINGLE, CHORD, arpegios, grupos y compilador MIDI (compás = 4 pulsos, 4/4); la rueda y los selectores incluyen `2m` y `4m`.
- **Intensidad** (2026-11-08): `@` por nota/grupo, `INTENSITY` base, `INTENSITY_PATTERN` cíclico y `INTENSITY_RAMP` por rango; reproducción y MIDI la transportan como velocity MIDI. El perfil es local al bloque (solo sus notas propias) y el editor conserva y muestra la intensidad.
- **`PATTERN_GAP` eliminado** (2026-11-08): era un no-op deprecado; fuera del lenguaje, parser/serializador, player, GUI, corpus y documentación. Un `.mr` antiguo con él falla con un error de migración hacia `DECORATION`.
- **Limpieza de código** (2026-11-08): eliminado el código v2 sin cablear (editor de melodía, reproductor/audio y servicios huérfanos, ~5.200 LOC) y cerrado el spike ANTLR #131. Se conservan `global-state`, `note-generation-unified`, `error-handler` y la API `carmen-core/music-element-utils`.
- **Limpieza de ramas** (2026-11-08): 16 worktrees de ramas mergeadas o cerradas eliminados; ramas locales/remotas antiguas limpiadas.
- **Angular 21 / Node 22 / TypeScript 5.9 / PrimeNG 21 / Jest 30**, application builder (`@angular/build`), componentes standalone, control flow y retirada de dependencias obsoletas.
- **Paquetes y CLI Carmen** (2026-11-08): renombrados a `carmen-core` y `carmen-cli`; binario único `carmen` (`compile`, `check`, `version`, `help`) y retirado el alias `moderanger-mid`.
- **CLI MIDI y CLI unificado** (`compile`, `check`, `version`, `help`), con núcleo puro sin Angular/Tone.
- **Warm Studio UI**, tema claro/oscuro persistente, panel de ejemplos, guía contextual de ayuda y bibliotecas de contenido en la GUI.

## Ramas archivadas (tags)

`archive/docs`, `archive/parse-from-text`, `archive/parse-from-text-no-angular`, `archive/better-interface`, `archive/new-circle`
— la auditoría concluyó que ninguna aporta funcionalidad viva.
