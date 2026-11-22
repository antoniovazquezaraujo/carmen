# ADR-007: Modulación por número de tritonos

- **Estado:** Aceptado (2026-11-22). Implementado en `.mr` v3 y en la GUI.
- **Fecha:** 2026-11-22
- **Autor:** DANI (coordinación y arquitectura)
- **Decisores:** el usuario (producto) + DANI (arquitectura)
- **Relacionado:**
  - `docs/developer/adr/ADR-005-tritonos-modulacion.md` (anclaje por tritono)
  - `docs/developer/adr/ADR-006-vistas-de-escala.md` (vistas y `COLLAPSE`)
  - `packages/core/src/tritone-count.ts` (búsqueda pura)
  - `scripts/tritone-lab.html` (laboratorio previo)
  - `docs/user/manual.md` (lenguaje `.mr`)

---

## 1. Contexto

`MODULATE <destino> FROM <origen> TO <destino>` exige conocer la escala destino y el ordinal de su tritono. El laboratorio de tritonos mostró una operación de más alto nivel: cambiar el **número** de tritonos conservando la orientación del tritono y minimizando el cambio de notas, sin nombrar la escala destino.

La promoción se hizo después de validar el laboratorio con el usuario. El laboratorio sigue siendo la referencia visual y auditiva del modelo.

## 2. Decisiones

1. **El tritono se orienta por su primera aparición en la escala.** `F–B` y `B–F` son objetos distintos: el segundo es la inversión del primero. Una modulación solo conserva un tritono si conserva también su orientación.
2. **`INVERT TRITONE` es una operación separada.** Conserva escala y vista, suma seis semitonos a `KEY` y fija el par de notas del tritono; el resto de notas se mueven. No se mezcla con `ADD`/`REMOVE`.
3. **Sintaxis:**
   - `ADD TRITONE KEEP <n>`
   - `REMOVE TRITONE KEEP <n>`
   - `INVERT TRITONE`
4. **`KEEP <n>` es 1-based.**
   - Al añadir, `n` es la posición del tritono conservado en el **destino**.
   - Al quitar, `n` es la posición del tritono conservado en el **origen**.
5. **Prioridad de la búsqueda:**
   1. conservar el tritono de la posición indicada;
   2. maximizar los tritonos orientados conservados;
   3. minimizar las notas que salen y entran;
   4. desempate determinista (key más cercana, orden de escala, key).
6. **No se invierte nunca dentro de `ADD`/`REMOVE`.** Si la única solución invierte el tritono, la operación no la usa; para eso está `INVERT TRITONE`.
7. **`REMOVE TRITONE` desde WHITE no tiene efecto.** Llegar a cero tritonos es una vista, no una escala padre; se usa `COLLAPSE` (PENTA).
8. **No hay escala padre con cinco tritonos.** `ADD TRITONE` desde BLACK/FULL y `REMOVE TRITONE` desde FULL no tienen efecto.
9. **`TONES` ↔ `BLACK` es un intercambio.** Cambia el número neto en uno, pero solo conserva dos tritonos. La operación se aplica y el laboratorio lo marca como `swap`; no se presenta como una conservación completa.
10. **Persistencia:** las tres operaciones son operaciones de procedimiento. Cambian escala/key para el resto de la canción y sobreviven a la restauración de overrides, igual que `MODULATE`.
11. **La búsqueda usa escalas padre, no vistas.** Las vistas siguen siendo un ajuste de preset/override (`COLLAPSE`) y no son destinos de estas operaciones.
12. **La GUI expone `KEEP` como número y `INVERT TRITONE` como una operación sin argumentos.** El editor de procedimientos muestra el control de posición solo para `ADD`/`REMOVE`.

## 3. Algoritmo

Para un cambio `d = +1` o `d = -1`:

1. Calcular los tritonos orientados de la escala/key actual.
2. Recorrer las seis escalas padre y sus 12 keys.
3. Filtrar las que tienen `tritonos actuales + d`.
4. Filtrar por la posición `KEEP` pedida.
5. Ordenar por tritonos conservados, notas fuera/dentro y desempate.
6. Aplicar la mejor candidata: `selectScale` + `KEY`.

La implementación pura está en `packages/core/src/tritone-count.ts`; el jugador y el compilador la reutilizan.

## 4. Ejemplos

Desde `WHITE` en `D` (key 2):

| Operación | Resultado | Conserva | Notas |
|---|---|---|---|
| `ADD TRITONE KEEP 1` | `RED` en `E` (key 4) | `F–B` primero | 2 fuera, 2 dentro |
| `ADD TRITONE KEEP 2` | `RED` en `C` (key 0) | `F–B` segundo | 2 fuera, 2 dentro |
| `INVERT TRITONE` | `WHITE` en `G#` (key 8) | `B–F` | key + 6 |
| `REMOVE TRITONE KEEP 1` | sin efecto | — | usar `COLLAPSE` |

Desde `BLUE` en `G` (key 7):

| Operación | Resultado | Conserva |
|---|---|---|
| `REMOVE TRITONE KEEP 1` | `WHITE` en `F#` (key 6) | `A–Eb` |
| `REMOVE TRITONE KEEP 2` | `WHITE` en `G#` (key 8) | `B–F` |

## 5. Alternativas consideradas

| Alternativa | Motivo del descarte |
|---|---|
| `ADD/REMOVE` sin `KEEP` | Deja empates entre escalas que conservan tritonos distintos con el mismo coste. |
| Nombres de notas (`ADD F-B`) | El usuario no debe manejar nombres; además la orientación depende de la escala. |
| Invertir automáticamente cuando no hay solución | Mezcla dos operaciones y oculta el cambio de orientación. |
| Incluir vistas en la búsqueda | Las vistas no tienen tónica/key propias; para 0 tritonos está `COLLAPSE`. |
| Usar `MODULATE` como única interfaz | Obliga a conocer la escala destino y el ordinal; la operación por conteo es la interfaz de alto nivel. |

## 6. Consecuencias

### Positivas

- El usuario puede modular sin conocer la escala destino.
- La orientación del tritono deja de perderse por una normalización de pares.
- `INVERT TRITONE` queda como una operación explícita y separada.
- La búsqueda es determinista y testeable.
- El laboratorio y el lenguaje comparten el mismo modelo.

### Costes y riesgos

- El serializador y el parser tienen tres operaciones nuevas.
- La GUI necesita un control de posición y una pista para `INVERT`.
- Algunas transiciones suaves que invierten el tritono quedan fuera de `ADD`/`REMOVE`; requieren `INVERT` + modulación.
- `TONES` ↔ `BLACK` no es una conservación completa; el usuario debe saberlo.
- No hay solución para cinco tritonos.

## 7. Referencias

- `packages/core/src/tritone-count.ts`
- `packages/core/src/operation.ts`
- `packages/core/src/player.ts`
- `packages/core/src/mr/mr.parser.ts`
- `packages/core/src/mr/mr.serializer.ts`
- `scripts/tritone-lab.html`
- `docs/user/manual.md`
