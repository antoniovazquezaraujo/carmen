# ADR-005: Tritonos, modulación por anclaje y vistas pentatónicas

- **Estado:** Propuesto (2026-11-15). Diseño sin implementar.
- **Fecha:** 2026-11-15
- **Autor:** DANI (coordinación y arquitectura)
- **Decisores:** el usuario (producto) + DANI (arquitectura)
- **Relacionado:**
  - `docs/developer/adr/ADR-001-texto-canonico-y-sintaxis-mr.md` (texto canónico)
  - `docs/developer/adr/ADR-004-bibliotecas-contenido.md` (bloques estructurales y bibliotecas)
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
2. PENTA se trata como una escala más, pero no tiene tritonos ni centro tritonal propio. Su identidad depende de la escala de la que se considera una vista.
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
6. **PENTA no es una escala primaria.** Es una vista de una escala padre, normalmente WHITE o BLUE.
7. **La ocultación de tritonos es una operación de vista**, no una modulación:
   - `HIDE_TRITONE LOW|HIGH`
   - `HIDE_TRITONES`
   - `UNHIDE`
8. **El MVP de ocultación se limita a WHITE y BLUE.** RED, TONES y BLACK pueden permitirse como caso experimental, pero sus resultados no se consideran pentatónicas clásicas.
9. **`SCALE` y `KEY` se mantienen** como herramientas de bajo nivel. `MODULATE` y las vistas no las eliminan.

## 3. Representación de escalas y tritonos

### 3.1. Inicios de tritono

Con raíz `0`, las escalas actuales producen estos inicios:

| Escala | Inicios de tritono (mod 6) |
|---|---|
| PENTA | ∅ |
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

Los pares son no ordenados: `(3,9)` y `(9,3)` describen el mismo tritono.

### 3.2. Patrones de distancia

Al normalizar en el ciclo de 6 posiciones, los patrones de separación son:

| Escala | Patrón |
|---|---|
| WHITE | `6` (un único punto) |
| BLUE | `2,4` |
| RED | `2,4` |
| TONES | `2,2,2` |
| BLACK | `1,2,1,2` |
| PENTA | — |

BLUE y RED comparten patrón circular; lo que cambia es la fase/key. TONES y BLACK tienen patrones propios.

## 4. Modulación por anclaje

### 4.1. Semántica

Sea `S` el conjunto de inicios del origen y `T` el del destino, ordenados de menor a mayor.

Para `MODULATE destino FROM i TO j`:

```text
s = S[i-1]
t = T[j-1]
k = (s - t) mod 6
T_k = { (x + k) mod 6 : x ∈ T }

fijos    = S ∩ T_k
añadidos = T_k \ S
quitados = S \ T_k
```

La rotación `k` fija la fase de los tritonos del destino. La key exacta se resuelve después aplicando las notas reales del patrón; el modelo de tritonos por sí solo no distingue una key de otra separada por una octava.

### 4.2. Ejemplo

Partiendo de WHITE `{3}`:

```text
MODULATE BLUE FROM 1 TO 2
```

- origen: `s = 3`
- destino: ordinal 2 de BLUE, `t = 4`
- rotación: `k = (3 - 4) mod 6 = 5`
- destino rotado: `{1,3}`
- fijos: `{3}`
- añadidos: `{1}`
- quitados: ∅

El usuario no escribe la key; el anclaje la determina.

### 4.3. Espacio de comandos

Para un origen con `n` tritonos y un destino con `m`, existen `n × m` anclas posibles:

```text
origen:  1..n
destino: 1..m
```

Todas son válidas si los ordinales existen. La tabla exhaustiva de comandos puede generarse a partir de esa regla; no es necesario mantener una tabla manual en el ADR.

## 5. Vistas y ocultación de tritonos

### 5.1. Comandos

```text
HIDE_TRITONE LOW
HIDE_TRITONE HIGH
HIDE_TRITONES
UNHIDE
```

- Ocultar un tritono significa retirar sus dos notas de la vista sonora.
- La escala padre, su key y su centro siguen existiendo.
- `UNHIDE` recupera el padre completo.
- `LOW` y `HIGH` se refieren al tritono más bajo y más alto del padre.

### 5.2. WHITE y BLUE en el MVP

WHITE tiene un único tritono. Ocultarlo deja cinco notas: es una vista pentatónica.

BLUE tiene dos. Ocultar uno deja cinco notas con el otro tritono todavía presente; ocultar ambos deja tres notas sin tritonos.

| Escala | Acción | Resultado |
|---|---|---|
| WHITE | `HIDE_TRITONE` | 5 notas, sin tritonos |
| BLUE | `HIDE_TRITONE LOW` | 5 notas, conserva el tritono alto |
| BLUE | `HIDE_TRITONE HIGH` | 5 notas, conserva el tritono bajo |
| BLUE | `HIDE_TRITONES` | 3 notas, sin tritonos |

En BLUE, las dos primeras vistas conservan uno de los dos tritonos y la tercera elimina ambos. No se identifican aquí con nombres externos como “pentatónica del diablo”: ese nombre no tiene una definición cerrada en este ADR. Con las tablas actuales, el patrón `{0,2,4,6,9}` tiene dos transposiciones dentro de BLUE (`{0,2,5,8,10}` y `{0,2,4,7,10}`), pero no coincide con las vistas que se obtienen ocultando un tritono completo. Es una decisión abierta.

### 5.3. PENTA como vista

PENTA no se implementa como una escala primaria. Se obtiene de un padre:

```text
SCALE WHITE
KEY F
HIDE_TRITONE
```

El padre es WHITE en F; la vista resultante es una pentatónica. Las tres perspectivas pentatónicas de WHITE se seleccionan cambiando la key del padre antes de ocultar el tritono.

Para BLUE:

```text
SCALE BLUE
HIDE_TRITONE LOW
```

o:

```text
SCALE BLUE
HIDE_TRITONE HIGH
```

La escala padre conserva el centro tonal; la vista solo decide qué notas suenan.

## 6. Alcance en el lenguaje

Propuesta inicial, pendiente de validar al implementar:

- `MODULATE` es una **operación de procedimiento**. Ocurre en un punto del tiempo y cambia el estado armónico.
- `HIDE_TRITONE`/`HIDE_TRITONES`/`UNHIDE` son operaciones de **vista**, aplicables a un bloque o a una pasada; no cambian la escala padre.
- `SCALE` y `KEY` siguen siendo los ajustes de bajo nivel del preset.
- La serialización debe conservar el padre de la vista; no basta con guardar “PENTA”.

## 7. Alternativas consideradas

| Alternativa | Motivo del descarte |
|---|---|
| Seguir usando solo `SCALE` + `KEY` | Obliga a conocer la key y no expresa qué tritono se conserva. Se mantiene como bajo nivel, no como interfaz principal. |
| `MODULATE <destino>` sin ancla | Vuelve a introducir empates de key; no es determinista. |
| `KEEP`/`AS` con nombres de notas | El usuario no debe manejar nombres de notas; además, el tritono es reversible y el nombre del extremo es ambiguo. |
| PENTA como sexta escala primaria | No tiene centro tritonal propio y su key depende del padre. Se sustituye por una vista. |
| Ocultar tritonos en todas las escalas como MVP | RED, TONES y BLACK producen resultados extraños (3, 4, 2 o 0 notas); quedan como experimental. |
| `NEAR`/`FAR`/`MID` como única interfaz | Útil como azúcar, pero no sustituye el control exacto del ancla; se deja para una fase posterior. |

## 8. Consecuencias

### Positivas

- El usuario puede modular sin conocer la key.
- El ancla de tritonos hace explícito qué se conserva, añade y elimina.
- PENTA deja de ser una escala ambigua y pasa a ser una vista con padre.
- El modelo es determinista y testeable sobre clases de altura.
- `SCALE`/`KEY` siguen disponibles para control fino.

### Costes y riesgos

- Hay que ampliar parser, serializador, modelo, player y compilador MIDI.
- La key exacta no queda determinada solo por los tritonos; hay que resolverla con las notas reales.
- La serialización de una vista PENTA necesita guardar el padre y la máscara.
- La GUI debe indicar que se está en una vista, no en una escala completa.
- El alcance de `HIDE` y `MODULATE` dentro de bloques y procedimientos aún no está cerrado.

## 9. Cuestiones abiertas

1. ¿`MODULATE` es una operación de procedimiento o una directiva de bloque?
2. ¿`HIDE_TRITONE` es local al bloque, a la pasada o al preset?
3. ¿Cómo se serializa una vista: `VIEW PENTA OF WHITE` o `SCALE WHITE` + `HIDE_TRITONE`?
4. ¿Se permite ocultar tritonos en RED, TONES y BLACK desde el principio o quedan detrás de una opción experimental?
5. ¿La key exacta se deriva de las notas reales, de la rotación de tritonos o de ambas?
6. ¿Se mantiene `UNHIDE` o basta con volver a `SCALE`/`MODULATE`?
7. ¿Se añaden alias cualitativos (`NEAR`, `MID`, `FAR`) o se posponen?
8. ¿“Pentatónica del diablo” se refiere a un patrón concreto o a cualquier vista de cinco notas con un tritono?
9. ¿Esto exige `.mr` v3 o puede entrar como extensión opcional de v2?

## 10. Plan de implementación propuesto

1. Aprobar este ADR y cerrar las cuestiones abiertas.
2. Añadir una utilidad pura de tritonos: inicios mod 6, rotación, fijos/añadidos/quitados.
3. Extender parser y serializador con `MODULATE` y las operaciones de vista.
4. Extender el player y el compilador MIDI con paridad de comportamiento.
5. Añadir tests de:
   - WHITE → BLUE con anclas 1→1 y 1→2;
   - BLUE → WHITE;
   - ocultar LOW/HIGH en BLUE;
   - PENTA como vista de WHITE;
   - serialización y round-trip.
6. Añadir la representación visual de la vista y del padre en la GUI.
7. Documentar la sintaxis en `docs/user/manual.md` y `docs/user/cheatsheet.md`.

## 11. Referencias

- `docs/developer/adr/ADR-001-texto-canonico-y-sintaxis-mr.md`
- `docs/developer/adr/ADR-004-bibliotecas-contenido.md`
- `docs/user/manual.md`
- <https://github.com/antoniovazquezaraujo/particle-music>
