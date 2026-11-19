# ADR-005: Tritonos, modulación por anclaje y ocultación por semitonos

- **Estado:** Propuesto (2026-11-15, revisado 2026-11-16 y 2026-11-19). Diseño sin implementar; objetivo `.mr` v3.
- **Fecha:** 2026-11-15
- **Autor:** DANI (coordinación y arquitectura)
- **Decisores:** el usuario (producto) + DANI (arquitectura)
- **Relacionado:**
  - `docs/developer/adr/ADR-001-texto-canonico-y-sintaxis-mr.md` (texto canónico)
  - `docs/developer/adr/ADR-004-bibliotecas-contenido.md` (bloques estructurales y bibliotecas)
  - `docs/developer/adr/ADR-006-vistas-de-escala.md` (modelo general de vistas)
  - `docs/user/manual.md` (lenguaje `.mr` actual)
  - <https://github.com/antoniovazquezaraujo/particle-music> (marco teórico de Música de partículas)

---

## 1. Contexto

El lenguaje actual expresa la armonía mediante `SCALE` y `KEY`, más ajustes de generación (`WIDTH`, `GAP`, `INV`, `PLAYMODE`, `PATTERN`, etc.). La escala es una enumeración fija:

```text
WHITE, BLUE, RED, BLACK, PENTA, TONES, FULL
```

Esta representación tiene tres limitaciones para el trabajo armónico:

1. Cambiar de escala exige conocer y escribir la key de destino, aunque el usuario solo quiera conservar una parte de la estructura del estado anterior.
2. PENTA se trata como una escala más, pero no tiene tritonos ni centro tritonal propio.
3. No existe una operación de alto nivel que diga “conserva este tritono y alinéalo con este otro de la escala destino”.

El objetivo de este ADR es fijar un modelo pequeño y formal para expresar esos cambios sin obligar al usuario a manejar nombres de notas ni keys.

## 2. Decisiones

1. **El tritono se representa por su nota inicial**, no por un par:
   - un tritono es `(s, s + 6)`;
   - `s` y `s + 6` son el mismo tritono;
   - los inicios se normalizan en el ciclo `0..5`.
2. **Cada escala se representa por su conjunto de inicios de tritono**, módulo 6.
3. **La operación de modulación es por anclaje de tritonos**:
   - el usuario elige un tritono del origen y un ordinal del destino;
   - el sistema calcula la rotación/key y los tritonos que se conservan, añaden o eliminan.
4. **La sintaxis propuesta es:**

   ```text
   MODULATE <escalaDestino> FROM <tritonoOrigen> TO <tritonoDestino>
   ```

   Los ordinales se cuentan de abajo arriba: `1` es el tritono más bajo.
5. **La key no se introduce a mano en `MODULATE`.** Es una consecuencia del anclaje.
6. **PENTA se elimina como escala padre en `.mr` v3.** Su conjunto se representa como vista: se fija en ADR-006. La primitiva del nuevo modelo es la **ocultación por semitonos**: colapsar cada semitono que toca un extremo de tritono dejando una sola de sus dos notas.
7. **La ocultación es un ajuste de preset**, no una operación de procedimiento. Se implementa colapsando los semitonos que contienen un extremo de tritono: de cada semitono sobrevive una sola nota. En WHITE y BLUE, con dos semitonos, hay cuatro vistas:
   - `VIEW COLLAPSE_BOTH_LOW|COLLAPSE_BOTH_HIGH|COLLAPSE_LOW_HIGH|COLLAPSE_HIGH_LOW`
   - `VIEW COLLAPSE_NONE` (alias: `UNHIDE`)
   Para que sea local a un bloque se usará `overrides`, igual que `SCALE`. La vista puede conservar algún tritono; el laboratorio lo reporta y la decisión de exigir “sin tritonos” queda abierta. El modelo general de vistas se fija en ADR-006.
8. **El MVP de ocultación se limita a WHITE y BLUE.** RED y BLACK tienen cuatro semitonos y TONES no tiene ninguno, así que las cuatro vistas de dos semitonos no aplican. Quedan aparcados.
9. **`SCALE` y `KEY` se mantienen** como herramientas de bajo nivel. `MODULATE` y la ocultación no las eliminan.
10. **La key exacta se calcula con las notas reales**, no solo con el patrón mod 6. Los inicios mod 6 identifican el tritono; los inicios reales `0..11` fijan la key.
11. **El cambio se documentará en `.mr` v3**, aunque sea compatible con archivos v2.
12. **La ocultación se serializa donde se declara**: si está en un preset, se guarda en el preset; si está en `overrides`, se guarda en el override.
13. **La ocultación no es un mute posterior**: la escala visible se recalcula antes de generar y se **reindexa de 0 a n-1**. Los números de nota son grados de esa escala visible, no de la escala padre. Arpegios, `WIDTH`, `GAP`, `INV`, `PATTERN`, `DECORATION` y `OCTAVE_PATTERN` trabajan sobre la escala visible.

## 3. Representación de escalas y tritonos

### 3.1. Inicios de tritono

Con raíz `0`, las escalas actuales producen estos inicios:

| Escala | Inicios de tritono (mod 6) |
|---|---|
| WHITE | `{3}` |
| BLUE | `{2,4}` |
| RED | `{1,5}` |
| TONES | `{0,2,4}` |
| BLACK | `{1,2,4,5}` |

Los pares reales, antes de normalizar, son:

| Escala | Pares |
|---|---|
| WHITE | `(3,9)` |
| BLUE | `(2,8)`, `(4,10)` |
| RED | `(1,7)`, `(5,11)` |
| TONES | `(0,6)`, `(2,8)`, `(4,10)` |
| BLACK | `(1,7)`, `(2,8)`, `(4,10)`, `(5,11)` |

Los pares son no ordenados: `(3,9)` y `(9,3)` describen el mismo tritono. PENTA se elimina en `.mr` v3 (ADR-006): no se usa como primitiva.

### 3.2. Patrones de distancia

Al normalizar en el ciclo de 6 posiciones, los patrones de separación son:

| Escala | Patrón |
|---|---|
| WHITE | `6` (un único punto) |
| BLUE | `2,4` |
| RED | `2,4` |
| TONES | `2,2,2` |
| BLACK | `1,2,1,2` |

BLUE y RED comparten patrón circular; lo que cambia es la fase/key. TONES y BLACK tienen patrones propios.

### 3.3. Semitonos en WHITE y BLUE

Las dos escalas del MVP tienen exactamente dos semitonos:

| Escala | Semitonos |
|---|---|
| WHITE | `(2,3)`, `(9,10)` |
| BLUE | `(4,5)`, `(7,8)` |

Cada semitono contiene un extremo de tritono: en WHITE, `3` y `9`; en BLUE, `4` y `8`. Esa correspondencia es la que permite definir las cuatro vistas de ocultación.

## 4. Modulación por anclaje

### 4.1. Semántica

Sea `S` el conjunto de **inicios reales** del origen y `T` el del destino, ordenados de menor a mayor. Los inicios reales están en `0..11`.

Para `MODULATE destino FROM i TO j`:

```text
s = inicio real del tritono origen
t = inicio real del ordinal destino
k = (s - t) mod 12
T_k = { (x + k) mod 12 : x ∈ T }
```

`T_k` se vuelve a normalizar por pares para comparar tritonos. La `k` resultante es la key exacta.

### 4.2. Ejemplo

Partiendo de WHITE `(3,9)`:

```text
MODULATE BLUE FROM 1 TO 2
```

- origen: `s = 3`
- destino: ordinal 2 de BLUE, inicio real `t = 4`
- key: `k = (3 - 4) mod 12 = 11`
- destino desplazado: `(1,7)`, `(3,9)`
- fijos: `(3,9)`
- añadidos: `(1,7)`
- quitados: ∅

El usuario no escribe la key; el anclaje la determina. El `k` mod 6 solo indicaba la fase del patrón; el `k` mod 12 es la transposición real.

### 4.3. Espacio de comandos

Para un origen con `n` tritonos y un destino con `m`, existen `n × m` anclas posibles:

```text
origen:  1..n
destino: 1..m
```

Todas son válidas si los ordinales existen. La tabla exhaustiva de comandos puede generarse a partir de esa regla; no es necesario mantener una tabla manual en el ADR.

## 5. Ocultación por semitonos

### 5.1. Semántica

La ocultación no retira un extremo del tritono: **colapsa los semitonos que contienen un extremo de tritono**. De cada uno de esos semitonos sobrevive una sola nota; la otra desaparece de la escala visible. Este es un caso concreto de **vista de escala**; el modelo general está en ADR-006.

En WHITE y BLUE hay exactamente dos semitonos y cada uno contiene un extremo de tritono. Por tanto hay cuatro vistas, según se conserve la nota inferior o superior de cada semitono, en orden ascendente:

| Vista | Semitono 1 | Semitono 2 |
|---|---|---|
| `COLLAPSE_BOTH_HIGH` | superior | superior |
| `COLLAPSE_BOTH_LOW` | inferior | inferior |
| `COLLAPSE_LOW_HIGH` | inferior | superior |
| `COLLAPSE_HIGH_LOW` | superior | inferior |

`HIGH` significa “se queda la nota superior del semitono”; `LOW`, “se queda la inferior”. La escala visible resultante no tiene semitonos y se reindexa de `0` a `n-1`.

La ocultación **no garantiza que desaparezcan todos los tritonos**: un tritono puede sobrevivir si sus dos notas están entre las conservadas. El laboratorio muestra qué tritonos quedan en cada vista. Si se quiere exigir una vista sin tritonos, habrá que añadir una condición adicional (decisión pendiente).

### 5.2. Comandos propuestos

La vista se declara como un ajuste separado del padre; el modelo general está en ADR-006.

```text
SCALE WHITE
VIEW COLLAPSE_BOTH_HIGH

SCALE BLUE
VIEW COLLAPSE_NONE
```

- `VIEW COLLAPSE_BOTH_HIGH` = subir/subir; `COLLAPSE_BOTH_LOW` = bajar/bajar; `COLLAPSE_LOW_HIGH` = bajar/subir; `COLLAPSE_HIGH_LOW` = subir/bajar.
- `VIEW COLLAPSE_NONE` recupera el padre completo; `UNHIDE` se mantiene como alias de compatibilidad.
- La escala padre, su key y su centro siguen existiendo.
- Si se cambia de escala mientras hay una vista activa, la vista sigue activa hasta `VIEW COLLAPSE_NONE`; se reinterpreta sobre el nuevo padre si es compatible (ADR-006, sección 5).
- Es un ajuste de preset, no una operación de procedimiento. Para que sea local a un bloque se usará `overrides`.
- La ocultación se serializa donde se declara: si está en el preset, se guarda en el preset; si está en `overrides`, se guarda en el override.
- **No es un mute posterior.** Las notas ocultas desaparecen de la escala visible y todos los comandos de generación se recalculan sobre ella.
- La sintaxis final de `VIEW` y la forma de escalas con más de dos semitonos quedan pendientes (ADR-006, sección 9).

### 5.3. Impacto en la generación

La vista visible cambia la escala que ven los comandos posteriores:

- `WIDTH` y `GAP` cuentan y seleccionan notas visibles.
- Los arpegios solo recorren notas visibles.
- `PATTERN`, `DECORATION` y `OCTAVE_PATTERN` se aplican sobre la escala visible.
- `INV` y las operaciones de inversión trabajan sobre la escala visible; las notas ocultas ya no forman parte de ella.
- Los grados de las notas se refieren siempre a la escala visible reindexada `0..n-1`. Una nota explícita no cae en silencio ni se redirige: apunta a otro grado visible y, por tanto, a otra nota.
- Si `VIEW` está en `overrides`, afecta a las notas propias del bloque; los hijos conservan la escala base, como el resto de overrides.
- Si está en el preset, afecta a todos los bloques que lo usan.

En la práctica, es como cambiar a una escala con menos grados: las notas siguen existiendo, pero los números indican otras notas. La escala visible se reindexa de `0` a `n-1`.

### 5.4. WHITE y BLUE en el MVP

WHITE tiene un tritono `(3,9)` y dos semitonos: `(2,3)` y `(9,10)`. BLUE tiene dos tritonos `(2,8)` y `(4,10)` y dos semitonos: `(4,5)` y `(7,8)`.

| Escala | Vista | Se queda | Se oculta | Visible | Tritonos que quedan |
|---|---|---|---|---|---|
| WHITE | `COLLAPSE_BOTH_HIGH` | 3,10 | 2,9 | `{0,3,5,7,10}` C Eb F G Bb | ∅ |
| WHITE | `COLLAPSE_BOTH_LOW` | 2,9 | 3,10 | `{0,2,5,7,9}` C D F G A | ∅ |
| WHITE | `COLLAPSE_LOW_HIGH` | 2,10 | 3,9 | `{0,2,5,7,10}` C D F G Bb | ∅ |
| WHITE | `COLLAPSE_HIGH_LOW` | 3,9 | 2,10 | `{0,3,5,7,9}` C Eb F G A | `(3,9)` |
| BLUE | `COLLAPSE_BOTH_HIGH` | 5,8 | 4,7 | `{0,2,5,8,10}` | `(2,8)` |
| BLUE | `COLLAPSE_BOTH_LOW` | 4,7 | 5,8 | `{0,2,4,7,10}` | `(4,10)` |
| BLUE | `COLLAPSE_LOW_HIGH` | 4,8 | 5,7 | `{0,2,4,8,10}` | `(2,8)`, `(4,10)` |
| BLUE | `COLLAPSE_HIGH_LOW` | 5,7 | 4,8 | `{0,2,5,7,10}` | ∅ |

El MVP no introduce nombres externos para estas vistas. RED y BLACK tienen cuatro semitonos, y TONES no tiene ninguno: las cuatro vistas de dos semitonos no aplican y quedan aparcadas.

### 5.5. Ejemplos

WHITE con la vista `COLLAPSE_BOTH_HIGH`:

```text
SCALE WHITE
KEY 5
VIEW COLLAPSE_BOTH_HIGH
```

`KEY` sigue siendo numérico. `KEY F` no forma parte de la sintaxis actual; admitir nombres de nota sería una extensión separada, no decidida en este ADR.

BLUE con la vista `COLLAPSE_HIGH_LOW`, la única vista de BLUE que deja la escala sin tritonos en el MVP:

```text
SCALE BLUE
VIEW COLLAPSE_HIGH_LOW
```

La escala padre conserva el centro tonal; la ocultación solo decide qué notas suenan.

## 6. Alcance en el lenguaje

- `MODULATE` es una **operación de procedimiento**: ocurre en un punto del tiempo y cambia la escala y la key actuales.
- `VIEW`/`VIEW COLLAPSE_NONE` son **ajustes de preset**. Para que sean locales a un bloque se usan en `overrides`.
- `SCALE` y `KEY` siguen siendo los ajustes de bajo nivel del preset.
- PENTA se elimina como escala padre en `.mr` v3 (ADR-006).
- La serialización conserva el ajuste de ocultación exactamente donde se ha declarado: preset o override.
- Este cambio se documentará en `.mr` v3, aunque pueda ser compatible con archivos v2.

## 7. Alternativas consideradas

| Alternativa | Motivo del descarte |
|---|---|
| Seguir usando solo `SCALE` + `KEY` | Obliga a conocer la key y no expresa qué tritono se conserva. Se mantiene como bajo nivel, no como interfaz principal. |
| `MODULATE <destino>` sin ancla | Vuelve a introducir empates de key; no es determinista. |
| `KEEP`/`AS` con nombres de notas | El usuario no debe manejar nombres de notas; además, el tritono es reversible y el nombre del extremo es ambiguo. |
| PENTA como escala padre | Se elimina en `.mr` v3; no tiene centro tritonal propio y se representa como vista (ADR-006). |
| Retirar solo un extremo del tritono | Deja vivo el semitono del otro extremo y no explica las cuatro vistas; se sustituye por el colapso de semitonos. |
| Ocultar tritonos en todas las escalas como MVP | RED y BLACK tienen cuatro semitonos y TONES ninguno; las cuatro vistas de dos semitonos no aplican. |
| `NEAR`/`FAR`/`MID` como interfaz | Se descarta por ahora; no sustituye al control exacto del ancla. |

## 8. Consecuencias

### Positivas

- El usuario puede modular sin conocer la key.
- El ancla de tritonos hace explícito qué se conserva, añade y elimina.
- La ocultación es un ajuste pequeño y reutilizable, no una nueva escala.
- En WHITE y BLUE produce cuatro vistas pentatónicas sin semitonos.
- Todas las generaciones derivadas usan la escala visible, evitando huecos silenciosos en arpegios y acordes.
- El modelo es determinista y testeable sobre clases de altura.
- `SCALE`/`KEY` siguen disponibles para control fino.

### Costes y riesgos

- Hay que ampliar parser, serializador, modelo, player y compilador MIDI.
- La key exacta requiere usar los inicios reales `0..11`; el patrón mod 6 no basta.
- La serialización de `VIEW` necesita una forma canónica dentro de `.mr` v3.
- La GUI debe indicar que hay notas ocultas y cuáles.
- Algunas vistas conservan un tritono; hay que decidir si se acepta o se exige una vista sin tritonos.
- La forma canónica exacta de serializar `VIEW` dentro de un preset o de un `override` aún no está cerrada.
- `.mr` v3 será necesario para expresar la relación completa entre escala, key y notas ocultas.

## 9. Decisiones pendientes

1. **Nombres de nota en `KEY`.** Admitir `KEY F` sería una extensión aparte, no decidida en este ADR. De momento `KEY` sigue siendo numérico.
2. **PENTA.** Se elimina como escala padre en `.mr` v3; el detalle está en ADR-006.
3. **Detalle de serialización de `VIEW`.** Se guarda donde se declara; queda concretar la forma canónica exacta en `.mr` v3.
4. **Sintaxis final de `VIEW`.** Se fija en ADR-006, sección 9.
5. **Escalas con más de dos semitonos.** RED y BLACK tienen cuatro; la sintaxis de cuatro parámetros o de un modo enumerado tendrá que decidirse antes de ampliar el MVP.
6. **¿Se exige que la vista no tenga tritonos?** En el MVP hay vistas que conservan uno o dos. Si el producto exige “sin tritonos”, habrá que añadir una condición y reducir las combinaciones disponibles.

## 10. Plan de implementación propuesto

1. Aprobar este ADR y cerrar las cuestiones abiertas.
2. Añadir una utilidad pura de tritonos y semitonos: inicios mod 6 para patrones, inicios reales mod 12 para la key, rotación, cálculo de fijos/añadidos/quitados y colapso de semitonos.
3. Extender parser y serializador con `MODULATE` y los ajustes `VIEW`/`VIEW COLLAPSE_NONE`/`UNHIDE`.
4. Extender el player y el compilador MIDI con paridad de comportamiento.
5. Añadir tests de:
   - WHITE → BLUE con anclas 1→1 y 1→2, comprobando la key exacta;
   - BLUE → WHITE;
   - las cuatro vistas de WHITE y BLUE, comprobando notas visibles, semitonos y tritonos restantes;
   - arpegios, `WIDTH`, `GAP` y `PATTERN` usando solo las notas visibles reindexadas;
   - notas explícitas reinterpretadas sobre la escala visible;
   - persistencia de la ocultación al cambiar de escala;
   - serialización y round-trip.
6. Añadir la representación visual de las notas ocultas en la GUI.
7. Documentar la sintaxis en `docs/user/manual.md` y `docs/user/cheatsheet.md`.

## 11. Referencias

- `docs/developer/adr/ADR-001-texto-canonico-y-sintaxis-mr.md`
- `docs/developer/adr/ADR-004-bibliotecas-contenido.md`
- `docs/user/manual.md`
- <https://github.com/antoniovazquezaraujo/particle-music>
