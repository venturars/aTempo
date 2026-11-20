# Cómo contribuir a aTempo

Esta guía explica cómo proponer un cambio en aTempo, desde la issue hasta la pull request. Sigue los pasos en orden. Las personas solo leen la issue y la pull request, así que todo lo que necesiten saber tiene que quedar escrito ahí.

## Contexto

aTempo registra la asistencia de los alumnos de una clase. El repositorio tiene la aplicación de escritorio del profesor (`desktop/`) y la guía visual compartida (`docs/storybook/`).

Antes de tocar nada, lee estos documentos:

1. [AGENTS.md](../AGENTS.md): las reglas de trabajo de los agentes. Mandan sobre este documento si hay conflicto.
2. [CONSTITUTION.md](CONSTITUTION.md): lo que ya está decidido para construir, como el stack y dónde está cada cosa.
3. [README.md](../README.md): qué hay en el repositorio y cómo se instala.

## Reglas que no se rompen

Haz:

- Trabaja siempre a partir de una issue.
- Abre la pull request contra `staging`, nunca contra `main`.
- Escribe los commits en inglés con [Conventional Commits](https://www.conventionalcommits.org/es/v1.0.0/).
- Pon en la issue toda pregunta o plan que necesite ayuda humana.

No hagas:

- No cambies el stack, la arquitectura ni la base de datos sin una issue aprobada antes.
- No añadas dependencias ni cambies versiones sin una issue aprobada antes.
- No abras una pull request sin una issue enlazada.
- No edites a mano `docs/guia/`: esa carpeta se genera sola.
- No hagas push a `main` ni a `staging`.
- No des por bueno un cambio que no hayas probado.

## Qué cambios se aceptan

- Correcciones de errores.
- Mejoras de las pantallas que ya existen, siguiendo la guía visual.
- Documentación: erratas, explicaciones que faltan o que han quedado desfasadas.
- Pruebas nuevas o mejores.

Cualquier otro cambio necesita una issue aprobada antes de empezar.

## Cómo se escribe la issue

Busca antes en las [issues](https://github.com/venturars/aTempo/issues) si ya existe una parecida. Si no, crea una con este formato:

- **Título** en inglés, empezando por un verbo. Ejemplo: `Fix the date on the attendance list`.
- **Etiqueta** con el tipo de cambio: `feat`, `fix`, `docs` o `chore`.
- **Descripción** en español, con estas tres partes:

```markdown
## Qué hay que hacer
Qué falla o qué falta, y qué debería pasar.

## Qué sigue igual
Lo que este cambio no toca.

## Cómo probarlo
Los pasos para comprobar que funciona.
```

Si es un error, añade en "Qué hay que hacer" los pasos para reproducirlo, lo que esperabas y lo que ha pasado.

Espera a que la issue esté asignada antes de programar. Si no lo está, para y pide la asignación en la issue.

## Flujo de trabajo

Cada paso espera a que el anterior esté hecho.

1. **Localiza la issue** y entiende qué hay que resolver.
2. **Lee la [constitución](CONSTITUTION.md)** y los documentos de la sección "Cómo se escribe el código".
3. **Investiga** cómo se resuelve la tarea.
4. **Sube a la issue** los artefactos `spec.md`, `plan.md` y `tasks.md`.
5. **Resuelve las dudas.** Si quedan preguntas que la issue no recoge, escríbelas en un `questions.md` y súbelo a la issue. No implementes hasta que una persona lo responda.
6. **Crea la rama** desde `staging` con el formato `número-tipo-descripción`. Ejemplo: `72-fix-attendance-date`.
7. **Desarrolla** la tarea.
8. **Prueba** lo desarrollado con las comprobaciones de abajo.
9. **Haz los commits** siguiendo las convenciones de abajo.
10. **Abre una pull request contra `staging`.** En la descripción escribe `Closes #número` con el número de la issue.
11. **Atiende la revisión.** La pull request necesita dos aprobaciones, y una tiene que ser de un code owner. Si piden cambios, súbelos a la misma rama.

Lo que pasa después no es cosa tuya: un code owner lleva `staging` a `main`, y cada cambio en `main` crea una versión nueva y su release.

## Comprobaciones antes de pedir revisión

Los comandos de `pnpm` de `desktop/` y `docs/storybook/` se lanzan en Docker, como explica el [README](../README.md#instalación):

```sh
docker compose run --rm desktop pnpm lint
docker compose run --rm desktop pnpm typecheck
```

Si el cambio toca un almacén, lanza sus pruebas de esquema:

```sh
docker compose run --rm postgres-test
docker compose run --rm sqlite-test
docker compose run --rm rustfs-test
docker compose run --rm blockend pnpm test
```

- `pnpm run test:visual` es la excepción: se lanza en el ordenador, no en Docker.
- Si cambias algo de `docs/storybook` (historias, reglas, tema o vista previa), regenera la guía y comprueba que está al día. Las dos órdenes tienen que salir bien:

```sh
docker compose run --rm storybook pnpm guide
docker compose run --rm storybook pnpm guide:check
```

Si una comprobación falla, arréglala antes de seguir. Si no puedes ejecutarla, dilo en la pull request. No digas que algo funciona si no lo has probado.

## Convenciones de commits

Un commit tiene este formato:

```text
tipo: qué hace el cambio
```

| Tipo | Para qué |
| --- | --- |
| `feat` | Una funcionalidad nueva. |
| `fix` | La corrección de un error. |
| `docs` | Solo documentación. |
| `test` | Pruebas nuevas o cambiadas. |
| `refactor` | Cambia el código sin cambiar lo que hace. |
| `ci` | Los workflows de GitHub Actions. |
| `chore` | Mantenimiento: dependencias, configuración y tareas sin cambio visible. |

Los commits deciden la versión, así que elige bien el tipo:

- `feat` sube la versión minor (de 1.2.3 a 1.3.0).
- `fix` y el resto suben la versión patch (de 1.2.3 a 1.2.4).
- Un `!` después del tipo (`feat!:`) o `BREAKING CHANGE` en el cuerpo del commit suben la versión major (de 1.2.3 a 2.0.0). Úsalo solo si el cambio rompe algo que ya funcionaba.

## Cómo se escribe el código

Sigue la documentación de los agentes y de `docs/`. Esos documentos mandan sobre cualquier otra costumbre:

- [AGENTS.md](../AGENTS.md): las reglas de trabajo de los agentes.
- [CONSTITUTION.md](CONSTITUTION.md): lo que ya está decidido para construir.
- [ARCHITECTURE.md](ARCHITECTURE.md): las tres capas del escritorio.
- [STYLE.md](STYLE.md): los temas y la guía visual.
- [TREE.md](TREE.md): dónde va cada carpeta de `desktop/`.

Si dos documentos se contradicen, o ninguno cubre tu caso, no decidas por tu cuenta: pregunta en la issue.

## Licencia

aTempo usa la licencia [Apache 2.0](../LICENSE). Al contribuir, la aportación se publica con esa misma licencia, como dice su sección 5.

Si reutilizas aTempo, conserva el aviso de [NOTICE](../NOTICE) y menciona el proyecto original.
