<p align="center">
  <img src="src/assets/brand/carmen.png" alt="Carmen — logotipo de teclado" width="620">
</p>

[![CI](https://github.com/antoniovazquezaraujo/carmen/actions/workflows/ci.yml/badge.svg?branch=develop)](https://github.com/antoniovazquezaraujo/carmen/actions/workflows/ci.yml)
[![Docs](https://img.shields.io/badge/docs-GitHub%20Pages-0078D4)](https://antoniovazquezaraujo.github.io/carmen/)
[![Web app](https://img.shields.io/badge/web%20app-open-0f766e)](https://antoniovazquezaraujo.github.io/carmen/app/)

[🇬🇧 Read in English](README.md)
# Carmen

_Carmen_ es un extraño secuenciador con capacidades algorítmicas. Se apoya en un lenguaje de programación musical donde la música se expresa por medio de documentos **`.mr`** (Music Representation) que describen de manera extraordinariamente concisa la armonía musical.

La versión web de _Carmen_ permite crear música y escucharla online, y el comando `carmen` permite compilar un fichero **`.mr`** que genera (y que el usuario puede modificar a su antojo) y convertirlo en _midi_, el formato de descripción musical totalmente abierto más usado.

En general, en lugar de describir una melodía directamente, nota a nota, en _Carmen_ es posible especificar las notas básicas de la melodía y conseguir que el sistema agregue o modifique notas para formar estructuras armónicas. Lo mismo con arpegios, lineas de bajo, acordes, o patrones.
No utiliza ningun tipo de notación mas que la propia numeración de las notas, aunque en realidad ni siquiera son notas, si no más bien grados de escalas. Esto permite una impresionante flexibilidad para realizar modulaciones y experimentos de todo tipo.
Las escalas utilizadas son las más usadas en la armonía occidental, aunque tampoco se les llama igual, tienen unos nombres más simples y una representación gráfica muy clara.

_Carmen_ es la parte práctica de **Música de partículas**, un marco que explica la armonía desde la estructura matemática y la percepción, no desde las convenciones tonales. En el se intenta separar la música de las personas, es decir, eliminar toda influencia humana en la música, todas las modas, las tradiciones, los estilos, los métodos y los mecanismos que las personas han ido agregando a la música a través de la historia. Se trata de tomar solamente la parte matemática de la música y no dar por supuesto absolutamente nada.

El objetivo es demostrar que la música "funciona" por sí misma, sin necesidad de que ningún humano catalogue con su oido si algo suena más o menos agradable. La música funciona "a pesar" de nosotros y lo cierto es que no es un invento del ser humano, sino un descubrimiento. La mayoría de técnicas que se han utilizado para contar historias a través de la música ya estaban ahí, solamente había que usarlas. Y no, un acorde mayor nunca va a sonar triste y uno menor alegre, aunque las modas musicales pongan el mundo del revés. No es posible. Porque la música tiene una base real, como se explica en [Música de partículas](https://github.com/antoniovazquezaraujo/particle-music)

## Probar en el navegador

La build web actual está publicada en **<https://antoniovazquezaraujo.github.io/carmen/app/>**; no hace falta instalar nada. La documentación de usuario sigue en la raíz del sitio.

## Quickstart

Requiere **Node 22** (por ejemplo con nvm) y npm 10.

```sh
export PATH="$HOME/.nvm/versions/node/v22.23.3/bin:$PATH"   # Node 22 vía nvm

npm ci        # instala dependencias
npm start     # arranca la app en http://localhost:4200
npm test      # suite Jest (núcleo, sin navegador)
npm run build # build de producción
```

## El lenguaje `.mr`

Una canción mínima:

```mr
song Semilla
version 2

melodies
  melody Origen
    notes
      4n:0
      4n:2
      4n:4
      4n:2

part Piano
  block Origen
    melody Origen
```

Se edita en la GUI, en la vista avanzada de texto (botón `.mr``) o con cualquier editor; se guarda y se carga como fichero `.mr` (UTF-8/LF, sin ids volátiles, apto para diffs de git). Los ejemplos completos de la guía se validan en cada `npm test`.

## Documentación

- 🎹 **[Aplicación web](https://antoniovazquezaraujo.github.io/carmen/app/)** — ejecuta la build web actual en el navegador.
- **[Música de partículas](https://github.com/antoniovazquezaraujo/particle-music)** - base teórica.
- 🌐 **[Documentación de usuario](https://antoniovazquezaraujo.github.io/carmen/)** — manual del lenguaje, chuleta de sintaxis y guía de uso.
- 📘 **[Manual del lenguaje `.mr`](docs/user/manual.md)** — referencia completa (también en el sitio publicado).
- 🧑‍💻 **[Wiki de desarrollo](docs/developer/README.md)** — arquitectura, ADRs, análisis, auditorías, diseño y proceso de release.
- ✅ **[Validación manual v1](docs/developer/testing/validacion-manual-v1.md)** — checklist paso a paso.
- 🗒️ **[Changelog](CHANGELOG.md)** — cambios por versión.
- 🤝 **[Contribuir](CONTRIBUTING.md)** — flujo de ramas, PRs y convenciones.
- 💚 **[Soporte (Neo)Vim](editors/nvim/README.md)** — `ftdetect`, `syntax` y `ftplugin` para `.mr`.

## Flujo de trabajo (resumen)

- `develop` es la rama de integración (protegida): se trabaja con ramas `feature/...` o `fix/...` y **PRs**.
- `main` refleja las versiones publicadas; los despliegues se lanzan con un tag `v*` (ver [`docs/developer/release/Release_Process.md`](docs/developer/release/Release_Process.md)).
- El CI (`tests + build`) es obligatorio en cada PR y la cobertura tiene umbral propio.
- La documentación de usuario se publica sola al hacer push a `develop`.
- La aplicación web se publica en `/app/` al empujar un tag `v*` (o manualmente con `workflow_dispatch`).

## Estructura rápida

| Ruta | Contenido |
|---|---|
| `src/app/model/mr/` | Parser, serializador, errores, fichero y contrato del `.mr`. |
| `src/app/model/mr/__tests__/corpus/` | Canciones `.mr` canónicas usadas por los tests. |
| `src/app/components/` | GUI (song-editor, parts, blocks, biblioteca de contenido, melody-editor, vista `.mr`). |
| `docs/user/` | Documentación pública (se publica en GitHub Pages). |
| `docs/developer/` | Wiki interna: ADR, análisis, auditorías, diseño, release. |
| `editors/nvim/` | Plugin opt-in de resaltado/indentación para `.mr`. |

## Licencia

[Apache-2.0](LICENSE).
