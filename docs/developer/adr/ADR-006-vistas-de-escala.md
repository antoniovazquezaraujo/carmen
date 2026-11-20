# ADR-006: Vistas de escala

- **Estado:** Aceptado (2026-11-20). Implementado en `.mr` v3.
- **Fecha:** 2026-11-19
- **Autor:** DANI (coordinación y arquitectura)
- **Decisores:** el usuario (producto) + DANI (arquitectura)
- **Relacionado:**
  - `docs/developer/adr/ADR-005-tritonos-modulacion.md` (tritonos, modulación y primera familia de vistas)
  - `docs/developer/adr/ADR-001-texto-canonico-y-sintaxis-mr.md` (texto canónico)
  - `docs/developer/adr/ADR-004-bibliotecas-contenido.md` (bloques estructurales y bibliotecas)
  - `docs/user/manual.md` (lenguaje `.mr` actual)
  - <https://github.com/antoniovazquezaraujo/particle-music> (marco teórico de Música de partículas)

---

## 1. Contexto

El laboratorio de tritonos de ADR-005 encontró que la ocultación correcta no es retirar un extremo del tritono, sino **colapsar los semitonos que lo tocan**: de cada semitono sobrevive una sola nota. El resultado no es una escala nueva: es una presentación de la escala padre.

La misma idea explica PENTA. Su conjunto `[0,2,5,7,10]` es exactamente:

- `WHITE` con la vista `COLLAPSE LOW_HIGH`;
- `BLUE` con la vista `COLLAPSE HIGH_LOW`.

PENTA no tiene centro tritonal propio porque no es un padre: es una vista huérfana. Al existir como escala suelta ha perdido el padre y, con él, el contexto armónico.

El modelo actual no puede expresar “esta escala, presentada así”. `SCALE` es una enumeración fija y no hay una capa de presentación. Este ADR fija el concepto de **vista de escala** y sus invariantes.

## 2. Decisiones

1. **Una vista es una proyección de una escala padre**: `(padre, regla, selección)`.
   - `padre`: la escala base (`WHITE`, `BLUE`, ...).
   - `regla`: la familia de proyección (p. ej. `SEMITONE_COLLAPSE`).
   - `selección`: los parámetros de la regla (qué nota sobrevive en cada semitono).
2. **La vista no es una escala padre.** No tiene tónica, key ni centro propios: hereda los del padre. No se puede usar como destino de `MODULATE` ni como padre de otra vista.
3. **La vista solo selecciona un subconjunto de los grados del padre.** No crea notas, no las transpone y no crea tritonos. Sus tritonos son un subconjunto de los del padre.
4. **La vista se define sobre los grados relativos del padre y se aplica antes de `KEY`.** El orden es `SCALE -> COLLAPSE -> KEY`. Si se aplicara después de transponer, la misma vista cambiaría de significado al cambiar de tono.
5. **Los grados de la vista se reindexan `0..n-1`.** Todos los comandos de generación (`WIDTH`, `GAP`, `INV`, `PATTERN`, `DECORATION`, `OCTAVE_PATTERN`, arpegios, notas explícitas) trabajan sobre la vista visible, no sobre el padre.
6. **La identidad de una vista es `(padre, regla, selección)`.** Dos vistas con el mismo conjunto de notas pero distinto padre son vistas distintas. Ejemplo: el conjunto de PENTA como vista de WHITE y como vista de BLUE.
7. **La vista se declara con el comando de su familia**, no con una operación de procedimiento.
   - `COLLAPSE BOTH_HIGH|BOTH_LOW|LOW_HIGH|HIGH_LOW` activa una vista de la familia `SEMITONE_COLLAPSE`.
   - `COLLAPSE NONE` recupera la escala padre completa; es la forma canónica de “sin vista”.
   - Se serializa donde se declara.
8. **La vista es una lente.** Se resuelve contra el padre efectivo del ámbito. Un override puede cambiar `SCALE` y heredar la vista (`COLLAPSE ...`); si la combinación es incompatible, se rechaza al cargar. En un cambio procedural (`MODULATE`, `$scale`), si el padre destino no admite la vista, esta se limpia a `COLLAPSE NONE` y se avisa.
9. **La primera familia es `SEMITONE_COLLAPSE`**, expuesta en el lenguaje como `COLLAPSE <modo>`. Agrupa los semitonos por tritono y forma **dos grupos**:
   - WHITE: los dos extremos del único tritono son los dos grupos.
   - BLUE y RED: cada tritono es un grupo; en RED cada grupo incluye sus dos semitonos.
   - BLACK: los tritonos que comparten los mismos dos semitonos forman un grupo (dos grupos).
   Cada grupo elige `LOW` o `HIGH` y se aplica a todos sus semitonos. Modos: `COLLAPSE BOTH_HIGH`, `BOTH_LOW`, `LOW_HIGH`, `HIGH_LOW`; `COLLAPSE NONE` es la identidad.
   - TONES no tiene semitonos: cualquier modo es identidad.
   - FULL no tiene una asociación única tritono↔semitono: queda fuera por ahora.
   - Las vistas de WHITE/BLUE/BLACK no tienen semitonos; RED puede conservar el semitono del solape `11–0`/`0–1` según el modo.
10. **PENTA se elimina como escala padre.** No hay compatibilidad hacia atrás: `SCALE PENTA` deja de ser válido en `.mr` v3. La equivalencia sonora es `WHITE` + `COLLAPSE LOW_HIGH` o `BLUE` + `COLLAPSE HIGH_LOW`; el usuario debe elegir el padre explícitamente. El parser puede sugerir la vista equivalente en el error, pero no migra el archivo.
11. **La serialización es explícita.** `SCALE`, `KEY` y el comando de vista (`COLLAPSE ...`) se guardan en el mismo ámbito; nunca se infiere la vista del conjunto de notas. `COLLAPSE NONE` es la forma canónica de “sin vista”.
12. **La GUI muestra el padre y la vista efectivos**, las notas ocultas y los tritonos que quedan. Si una vista se limpia por incompatibilidad, se avisa.

## 3. Modelo formal

### 3.1. Notación

Sea `P = [p0, p1, ..., pn-1]` la escala padre, ordenada y relativa a la raíz 0. Una vista `V = (regla, selección)` produce:

```text
view(P, V) = [ p_i : i ∈ keepIndices(P, V) ]
```

`COLLAPSE NONE` (identificador `COLLAPSE_NONE`) es el caso identidad: `view(P, COLLAPSE_NONE) = P`. La escala efectiva con key `k` es:

```text
effective(P, V, k) = transpose(view(P, V), k)
```

donde `transpose` suma `k` módulo 12 y vuelve a ordenar.

El orden es **`SCALE -> COLLAPSE -> KEY`**. No es equivalente a aplicar la vista sobre el padre ya transpuesto.

### 3.2. Invariantes

1. `view(P, V) ⊆ P` (subconjunto de grados, sin notas nuevas).
2. `tritones(view(P, V)) ⊆ tritones(P)` (no aparecen tritonos nuevos).
3. La tónica, la key y el centro son los del padre; la vista no los redefine.
4. `view(P, V)` se reindexa `0..n-1`; los grados de la vista no son los del padre.
5. La vista es key-invariante: la escala efectiva se calcula como `transpose(view(P, V), k)`, nunca como `view(transpose(P, k), V)`.
6. La vista es de un solo nivel: no hay vistas de vistas.

### 3.3. La familia `SEMITONE_COLLAPSE`

La regla agrupa los semitonos por tritono y forma dos grupos. Cada grupo elige `LOW` o `HIGH`; la vista conserva esa nota en todos los semitonos del grupo. Las notas visibles son la unión de las notas elegidas más las notas del padre que no pertenecen a ningún semitono; las ocultas son el resto.

| Escala | Grupos |
|---|---|
| WHITE | los dos extremos del único tritono |
| BLUE | cada tritono (un semitono por tritono) |
| RED | cada tritono (dos semitonos por tritono) |
| BLACK | los dos pares de tritonos que comparten semitonos |
| TONES | sin semitonos: identidad |
| FULL | sin asociación única tritono↔semitono: fuera del alcance |

Las cuatro vistas de cada escala soportada:

| Escala | `BOTH_LOW` | `BOTH_HIGH` | `LOW_HIGH` | `HIGH_LOW` |
|---|---|---|---|---|
| WHITE | `{0,2,5,7,9}` | `{0,3,5,7,10}` | `{0,2,5,7,10}` | `{0,3,5,7,9}` |
| BLUE | `{0,2,4,7,10}` | `{0,2,5,8,10}` | `{0,2,4,8,10}` | `{0,2,5,7,10}` |
| RED | `{0,4,7,11}` | `{0,1,5,8}` | `{0,5,7}` | `{1,4,8,11}` |
| BLACK | `{1,4,7,10}` | `{2,5,8,11}` | `{1,5,7,11}` | `{2,4,8,10}` |

WHITE, BLUE y BLACK producen vistas sin semitonos. En RED, `BOTH_LOW` conserva `(11,0)` y `BOTH_HIGH` conserva `(0,1)` por el solape del cluster; `LOW_HIGH` y `HIGH_LOW` sí quedan sin semitonos. Un tritono puede sobrevivir en cualquier vista; el resultado se reporta, no se oculta.

### 3.4. Ejemplo: PENTA

```text
PENTA = [0,2,5,7,10]
WHITE = [0,2,3,5,7,9,10]
WHITE + COLLAPSE LOW_HIGH: semitonos (2,3) y (9,10) -> conserva 2 y 10 -> [0,2,5,7,10] = PENTA
BLUE = [0,2,4,5,7,8,10]
BLUE + COLLAPSE HIGH_LOW: semitonos (4,5) y (7,8) -> conserva 5 y 7 -> [0,2,5,7,10] = PENTA
```

Con `KEY 5`, la vista se aplica antes de la transposición y sigue coincidiendo con PENTA transpuesta. Si se aplicara después de transponer, `WHITE` + `KEY 5` con `COLLAPSE LOW_HIGH` daría `[0,2,5,8,10]`, que no es PENTA.

## 4. Sintaxis propuesta

```text
SCALE WHITE
KEY 5
COLLAPSE BOTH_HIGH

SCALE BLUE
COLLAPSE NONE
```

- `COLLAPSE <modo>` activa una vista de la familia disponible para el padre efectivo. Modos: `BOTH_HIGH`, `BOTH_LOW`, `LOW_HIGH`, `HIGH_LOW`.
- `COLLAPSE NONE` es la vista identidad: no colapsa nada, recupera la escala padre completa y es la forma canónica de “sin vista”.
- No se introduce un `VIEW` genérico en el MVP. La familia interna es `SEMITONE_COLLAPSE` y se expone como el comando `COLLAPSE`; los identificadores internos de sus vistas son `COLLAPSE_<MODO>`.
- `COLLAPSE` puede recibir una variable (`COLLAPSE $modo`) en una fase posterior.
- La serialización canónica emite `COLLAPSE NONE` cuando no hay vista.
- La sintaxis final de `COLLAPSE` y la forma de las familias futuras quedan pendientes (sección 9).

## 5. Interacción con modulación

`MODULATE` es una operación de procedimiento que cambia el padre y la key. La vista es un ajuste de preset/override, no una operación.

- Si el padre destino es compatible con la vista (misma familia y dos grupos), la vista se conserva y se reinterpreta sobre el nuevo padre. En el MVP: WHITE, BLUE, RED y BLACK son compatibles; TONES es la identidad; FULL limpia la vista.
- Si el padre destino no es compatible, la vista se limpia a `COLLAPSE NONE` y se avisa. La GUI y la serialización muestran `COLLAPSE NONE`.
- `COLLAPSE NONE` es universal: no depende de la aridad del padre.
- `MODULATE` no puede apuntar a una vista: el destino es siempre un padre. Si se quiere modular a un padre y luego aplicar una vista, son dos pasos.
- Un cambio de `SCALE` por variable sigue la misma regla que `MODULATE`.

## 6. Interacción con overrides

La vista es una lente y se resuelve contra el padre efectivo.

- Un override puede cambiar solo `SCALE` y heredar la vista (`COLLAPSE ...`) del preset. Si el resultado es compatible, la vista se reinterpreta.
- Si el resultado es incompatible, el override es inválido y se rechaza al cargar.
- Un override puede declarar `COLLAPSE NONE` para desactivar la vista del preset.
- La serialización conserva `SCALE` y el comando `COLLAPSE` en el mismo ámbito; no se materializa la vista en cada bloque.

## 7. PENTA

PENTA se **elimina** como escala padre en `.mr` v3. No hay compatibilidad hacia atrás:

- `SCALE PENTA` deja de ser válido; el parser lo rechaza.
- No se migran archivos automáticamente ni se emite una serialización compatible.
- La equivalencia sonora documental es `WHITE` + `COLLAPSE LOW_HIGH` o `BLUE` + `COLLAPSE HIGH_LOW`; el usuario elige el padre.
- El mensaje de error puede sugerir esas dos vistas, pero no se aplica ninguna migración automática.
- La elección de WHITE como ejemplo canónico es arbitraria: WHITE tiene un solo tritono y es el padre más simple. `BLUE + COLLAPSE HIGH_LOW` produce las mismas notas, pero un contexto distinto.

## 8. Alternativas consideradas

| Alternativa | Motivo del descarte |
|---|---|
| Vista como escala nueva | Pierde el padre y el centro; es exactamente el problema de PENTA. |
| `SCALE WHITE + COLLAPSE BOTH_HIGH` compuesto | Mezcla padre y presentación en una sola declaración; complica overrides y variables. |
| `VIEW` como selector genérico | Se sustituye por `COLLAPSE <modo>` en el MVP; se puede introducir si aparece una segunda familia. |
| `HIDE_TRITONES` como comando principal | Describe la operación, no el concepto; la vista es una capa, no una ocultación. |
| Vista como mute posterior | La escala visible debe reindexarse antes de generar; un mute dejaría huecos. |
| PENTA como padre | No tiene centro tritonal propio; es una vista huérfana y se elimina en v3. |
| Mantener PENTA por compatibilidad | Se elimina sin migración automática; el error sugiere la vista equivalente. |
| Vistas anidadas | La composición no es conmutativa y complica la serialización; una vista de una vista no aporta en el MVP. |

## 9. Decisiones pendientes

1. **Nombre y sintaxis final de `COLLAPSE`.** `COLLAPSE BOTH_HIGH|BOTH_LOW|LOW_HIGH|HIGH_LOW` y `COLLAPSE NONE` son la forma propuesta; falta decidir cómo se representan familias futuras.
2. **Familias futuras.** `SEMITONE_COLLAPSE` es la primera; ¿habrá `TRITONE_ENDPOINT`, `REMOVE_DEGREE`, etc.? El modelo debe permitirlo sin cambiar la sintaxis base.
3. **FULL.** No tiene una asociación única tritono↔semitono; queda fuera hasta definir una regla propia.
4. **Variables de vista.** `COLLAPSE $modo` está soportado en el parser y la ejecución; falta decidir su presentación en la GUI.
5. **PENTA.** Confirmar el alcance de la eliminación (enum, parser, serializador, docs, ejemplos y GUI) y el texto del error que sugiere la vista equivalente.
6. **GUI.** Cómo mostrar la vista, las notas ocultas y los tritonos restantes sin saturar el editor. Para TONES y FULL solo se ofrece `NONE`.

## 10. Plan de implementación

1. Aprobar este ADR y cerrar las cuestiones abiertas.
2. Añadir el modelo puro `ScaleView` en `packages/core` (puede empezar en `experimental/tritone-lab.ts`).
3. Extender parser y serializador con `COLLAPSE`/`COLLAPSE NONE`.
4. Resolver la vista en el player y el compilador MIDI después de `SCALE` y antes de `KEY`.
5. Tests:
   - las cuatro vistas `COLLAPSE ...` de WHITE, BLUE, RED y BLACK;
   - TONES como identidad y FULL rechazada;
   - identidad de vistas: mismo conjunto, distinto padre;
   - `KEY` aplicada después de la vista (la vista de PENTA con `KEY 5`);
   - compatibilidad en overrides y modulación;
   - reindexado y comandos de generación sobre la vista;
   - serialización y round-trip;
   - rechazo de `SCALE PENTA` con sugerencia de vista equivalente.
6. GUI: selector de vista, notas ocultas, tritonos restantes y avisos de incompatibilidad.
7. Documentar en `docs/user/manual.md` y `docs/user/cheatsheet.md`.
8. Eliminar PENTA del enum, parser, serializador, docs y ejemplos (cambio rompedor de v3).

## 11. Consecuencias

### Positivas

- Separa “qué escala soy” de “cómo la presento”.
- Elimina la ambigüedad de PENTA: las mismas notas se expresan como vista de un padre explícito.
- Hace explícita la ocultación y evita mutes posteriores.
- La vista es key-invariante y testeable.
- El modelo admite nuevas familias sin rehacer el parser.

### Costes y riesgos

- Hay que tocar parser, serializador, player, compilador y GUI.
- La resolución de vistas en overrides y modulación añade reglas de compatibilidad.
- PENTA desaparece: es un cambio rompedor para archivos v2 y obliga a actualizar ejemplos y documentación.
- La serialización debe ser explícita; inferir la vista del conjunto de notas sería ambiguo.
- `.mr` v3 será necesario para la forma canónica completa.

## 12. Referencias

- `docs/developer/adr/ADR-001-texto-canonico-y-sintaxis-mr.md`
- `docs/developer/adr/ADR-004-bibliotecas-contenido.md`
- `docs/developer/adr/ADR-005-tritonos-modulacion.md`
- `docs/user/manual.md`
- <https://github.com/antoniovazquezaraujo/particle-music>
