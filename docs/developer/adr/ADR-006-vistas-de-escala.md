# ADR-006: Vistas de escala

- **Estado:** Propuesto (2026-11-19). Diseño sin implementar; objetivo `.mr` v3.
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

- `WHITE` con la vista `LOW_HIGH`;
- `BLUE` con la vista `HIGH_LOW`.

PENTA no tiene centro tritonal propio porque no es un padre: es una vista huérfana. Al existir como escala suelta ha perdido el padre y, con él, el contexto armónico.

El modelo actual no puede expresar “esta escala, presentada así”. `SCALE` es una enumeración fija y no hay una capa de presentación. Este ADR fija el concepto de **vista de escala** y sus invariantes.

## 2. Decisiones

1. **Una vista es una proyección de una escala padre**: `(padre, regla, selección)`.
   - `padre`: la escala base (`WHITE`, `BLUE`, ...).
   - `regla`: la familia de proyección (p. ej. `SEMITONE_COLLAPSE`).
   - `selección`: los parámetros de la regla (qué nota sobrevive en cada semitono).
2. **La vista no es una escala padre.** No tiene tónica, key ni centro propios: hereda los del padre. No se puede usar como destino de `MODULATE` ni como padre de otra vista.
3. **La vista solo selecciona un subconjunto de los grados del padre.** No crea notas, no las transpone y no crea tritonos. Sus tritonos son un subconjunto de los del padre.
4. **La vista se define sobre los grados relativos del padre y se aplica antes de `KEY`.** El orden es `SCALE -> VIEW -> KEY`. Si se aplicara después de transponer, la misma vista cambiaría de significado al cambiar de tono.
5. **Los grados de la vista se reindexan `0..n-1`.** Todos los comandos de generación (`WIDTH`, `GAP`, `INV`, `PATTERN`, `DECORATION`, `OCTAVE_PATTERN`, arpegios, notas explícitas) trabajan sobre la vista visible, no sobre el padre.
6. **La identidad de una vista es `(padre, regla, selección)`.** Dos vistas con el mismo conjunto de notas pero distinto padre son vistas distintas. Ejemplo: PENTA como vista de WHITE y como vista de BLUE.
7. **`VIEW` es un ajuste de preset/override, no una operación de procedimiento.**
   - `VIEW <vista>` activa una vista.
   - `VIEW NONE` la desactiva; `UNHIDE` se mantiene como alias de compatibilidad.
   - Se serializa donde se declara.
8. **La vista es una lente.** Se resuelve contra el padre efectivo del ámbito. Un override puede cambiar `SCALE` y heredar `VIEW`; si la combinación es incompatible, se rechaza al cargar. En un cambio procedural (`MODULATE`, `$scale`), si el padre destino no admite la vista, esta se limpia y se avisa.
9. **La primera familia es `SEMITONE_COLLAPSE`.** Colapsa cada semitono que toca un tritono dejando una sola nota. En WHITE y BLUE hay dos semitonos, así que hay cuatro vistas: `BOTH_HIGH`, `BOTH_LOW`, `LOW_HIGH`, `HIGH_LOW`. Las vistas no tienen semitonos; pueden conservar tritonos, que se reportan.
10. **PENTA se deprecia como escala padre.** Es equivalente a `WHITE/LOW_HIGH` y `BLUE/HIGH_LOW`. Los archivos v2 siguen leyendo `SCALE PENTA` por compatibilidad; la serialización nueva emite `SCALE WHITE` + `VIEW LOW_HIGH` y una nota de deprecación. La eliminación se decidirá en una versión mayor.
11. **La serialización es explícita.** `SCALE`, `KEY` y `VIEW` se guardan en el mismo ámbito; nunca se infiere la vista del conjunto de notas. `VIEW NONE` es la forma canónica de “sin vista”.
12. **La GUI muestra el padre y la vista efectivos**, las notas ocultas y los tritonos que quedan. Si una vista se limpia por incompatibilidad, se avisa.

## 3. Modelo formal

### 3.1. Notación

Sea `P = [p0, p1, ..., pn-1]` la escala padre, ordenada y relativa a la raíz 0. Una vista `V = (regla, selección)` produce:

```text
view(P, V) = [ p_i : i ∈ keepIndices(P, V) ]
```

La escala efectiva con key `k` es:

```text
effective(P, V, k) = transpose(view(P, V), k)
```

donde `transpose` suma `k` módulo 12 y vuelve a ordenar.

El orden es **`SCALE -> VIEW -> KEY`**. No es equivalente a aplicar la vista sobre el padre ya transpuesto.

### 3.2. Invariantes

1. `view(P, V) ⊆ P` (subconjunto de grados, sin notas nuevas).
2. `tritones(view(P, V)) ⊆ tritones(P)` (no aparecen tritonos nuevos).
3. La tónica, la key y el centro son los del padre; la vista no los redefine.
4. `view(P, V)` se reindexa `0..n-1`; los grados de la vista no son los del padre.
5. La vista es key-invariante: la escala efectiva se calcula como `transpose(view(P, V), k)`, nunca como `view(transpose(P, k), V)`.
6. La vista es de un solo nivel: no hay vistas de vistas.

### 3.3. La familia `SEMITONE_COLLAPSE`

La regla busca los semitonos del padre y, para cada uno, conserva la nota inferior o la superior. En WHITE y BLUE hay dos semitonos, de modo que la selección es un par `[LOW|HIGH, LOW|HIGH]` y hay cuatro vistas.

Las cuatro vistas de WHITE y BLUE están tabuladas en ADR-005, sección 5.4. La invariante de la familia es que la vista no tiene semitonos. No garantiza que no queden tritonos: un tritono sobrevive si sus dos notas están entre las conservadas. El resultado se reporta, no se oculta.

### 3.4. Ejemplo: PENTA

```text
PENTA = [0,2,5,7,10]
WHITE = [0,2,3,5,7,9,10]
WHITE/LOW_HIGH: semitonos (2,3) y (9,10) -> conserva 2 y 10 -> [0,2,5,7,10] = PENTA
BLUE = [0,2,4,5,7,8,10]
BLUE/HIGH_LOW: semitonos (4,5) y (7,8) -> conserva 5 y 7 -> [0,2,5,7,10] = PENTA
```

Con `KEY 5`, la vista se aplica antes de la transposición y sigue coincidiendo con PENTA transpuesta. Si se aplicara después de transponer, `WHITE` + `KEY 5` con `LOW_HIGH` daría `[0,2,5,8,10]`, que no es PENTA.

## 4. Sintaxis propuesta

```text
SCALE WHITE
KEY 5
VIEW BOTH_HIGH

SCALE BLUE
VIEW NONE
```

- `VIEW <vista>` activa una vista de la familia disponible para el padre efectivo.
- `VIEW NONE` la desactiva; `UNHIDE` es un alias de compatibilidad.
- `VIEW` puede recibir una variable (`VIEW $vista`) en una fase posterior.
- La serialización canónica emite `VIEW NONE` cuando no hay vista.
- La sintaxis final del nombre de la vista y de las familias con más de dos semitonos queda pendiente (sección 9).

## 5. Interacción con modulación

`MODULATE` es una operación de procedimiento que cambia el padre y la key. La vista es un ajuste de preset/override, no una operación.

- Si el padre destino es compatible con la vista (misma familia y aridad), la vista se conserva y se reinterpreta sobre el nuevo padre. En el MVP: WHITE ↔ BLUE.
- Si el padre destino no es compatible, la vista se limpia y se avisa. La GUI y la serialización muestran `VIEW NONE`.
- `MODULATE` no puede apuntar a una vista: el destino es siempre un padre. Si se quiere modular a un padre y luego aplicar una vista, son dos pasos.
- Un cambio de `SCALE` por variable sigue la misma regla que `MODULATE`.

## 6. Interacción con overrides

La vista es una lente y se resuelve contra el padre efectivo.

- Un override puede cambiar solo `SCALE` y heredar `VIEW` del preset. Si el resultado es compatible, la vista se reinterpreta.
- Si el resultado es incompatible, el override es inválido y se rechaza al cargar.
- Un override puede declarar `VIEW NONE` para desactivar la vista del preset.
- La serialización conserva `SCALE` y `VIEW` en el mismo ámbito; no se materializa la vista en cada bloque.

## 7. PENTA

PENTA se deprecia como escala padre:

- **Lectura v2:** `SCALE PENTA` se sigue aceptando; internamente se interpreta como `SCALE WHITE` + `VIEW LOW_HIGH` (padre canónico: WHITE).
- **Serialización v3:** se emite `SCALE WHITE` + `VIEW LOW_HIGH`, con una nota de deprecación.
- **Futuro:** la eliminación de `PENTA` del enum se decidirá en una versión mayor.
- La elección de WHITE como padre canónico es arbitraria pero determinista: WHITE tiene un solo tritono y es el padre más simple. `BLUE/HIGH_LOW` produce las mismas notas, pero un contexto distinto.

## 8. Alternativas consideradas

| Alternativa | Motivo del descarte |
|---|---|
| Vista como escala nueva | Pierde el padre y el centro; es exactamente el problema de PENTA. |
| `SCALE WHITE/BOTH_HIGH` compuesto | Mezcla padre y presentación; complica overrides y variables. |
| `HIDE_TRITONES` como comando principal | Describe la operación, no el concepto; la vista es una capa, no una ocultación. |
| Vista como mute posterior | La escala visible debe reindexarse antes de generar; un mute dejaría huecos. |
| PENTA como padre | No tiene centro tritonal propio; es una vista huérfana. |
| Vistas anidadas | La composición no es conmutativa y complica la serialización; una vista de una vista no aporta en el MVP. |

## 9. Decisiones pendientes

1. **Nombre y sintaxis final de `VIEW`.** `VIEW BOTH_HIGH` es la forma propuesta; falta decidir si el nombre incluye la familia (`VIEW SEMITONE_COLLAPSE BOTH_HIGH`) y cómo se representan vistas con más de dos semitonos.
2. **Familias futuras.** `SEMITONE_COLLAPSE` es la primera; ¿habrá `TRITONE_ENDPOINT`, `REMOVE_DEGREE`, etc.? El modelo debe permitirlo sin cambiar la sintaxis base.
3. **Padres de cuatro semitonos.** RED y BLACK tienen cuatro semitonos; la selección de cuatro posiciones y la UI de 16 vistas quedan fuera del MVP.
4. **Variables de vista.** ¿`VIEW $vista` desde el primer día o después?
5. **PENTA.** Confirmar la migración a `WHITE/LOW_HIGH` y la nota de deprecación; decidir la versión de eliminación.
6. **GUI.** Cómo mostrar la vista, las notas ocultas y los tritonos restantes sin saturar el editor.
7. **Modulación incompatible.** Confirmar que “limpiar + aviso” es el comportamiento deseado en vivo, frente a “rechazar la operación”.

## 10. Plan de implementación

1. Aprobar este ADR y cerrar las cuestiones abiertas.
2. Añadir el modelo puro `ScaleView` en `packages/core` (puede empezar en `experimental/tritone-lab.ts`).
3. Extender parser y serializador con `VIEW`/`VIEW NONE`/`UNHIDE`.
4. Resolver la vista en el player y el compilador MIDI después de `SCALE` y antes de `KEY`.
5. Tests:
   - las cuatro vistas de WHITE y BLUE;
   - identidad de vistas: mismo conjunto, distinto padre;
   - `KEY` aplicada después de la vista (PENTA con `KEY 5`);
   - compatibilidad en overrides y modulación;
   - reindexado y comandos de generación sobre la vista;
   - serialización y round-trip;
   - migración de PENTA.
6. GUI: selector de vista, notas ocultas, tritonos restantes y avisos de incompatibilidad.
7. Documentar en `docs/user/manual.md` y `docs/user/cheatsheet.md`.
8. Deprecar PENTA en una fase separada.

## 11. Consecuencias

### Positivas

- Separa “qué escala soy” de “cómo la presento”.
- Da contexto a PENTA sin convertirla en un padre artificial.
- Hace explícita la ocultación y evita mutes posteriores.
- La vista es key-invariante y testeable.
- El modelo admite nuevas familias sin rehacer el parser.

### Costes y riesgos

- Hay que tocar parser, serializador, player, compilador y GUI.
- La resolución de vistas en overrides y modulación añade reglas de compatibilidad.
- PENTA necesita una migración compatible y una nota de deprecación.
- La serialización debe ser explícita; inferir la vista del conjunto de notas sería ambiguo.
- `.mr` v3 será necesario para la forma canónica completa.

## 12. Referencias

- `docs/developer/adr/ADR-001-texto-canonico-y-sintaxis-mr.md`
- `docs/developer/adr/ADR-004-bibliotecas-contenido.md`
- `docs/developer/adr/ADR-005-tritonos-modulacion.md`
- `docs/user/manual.md`
- <https://github.com/antoniovazquezaraujo/particle-music>
