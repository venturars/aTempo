# Cómo contribuir a aTempo

¡Gracias por querer ayudar! Esta guía explica cómo proponer un cambio, desde la primera idea hasta que llega a una versión publicada.

## Bienvenida

aTempo registra la asistencia de los alumnos de una clase. Este repositorio tiene la aplicación de escritorio del profesor (`desktop/`) y la guía visual compartida (`docs/storybook/`).

Antes de contribuir, conviene leer:

- [README.md](../README.md): qué hay en el repositorio.
- [principles.md](../principles.md): la visión del producto, los perfiles de usuario y las decisiones de producto.
- [CONSTITUTION.md](CONSTITUTION.md): lo que ya está decidido para construir, como el stack y dónde está cada cosa.

## Cómo nos tratamos

- Trata a todo el mundo con respeto, sea cual sea su experiencia.
- Critica el código, no a la persona. Explica el porqué de cada comentario y propón una alternativa cuando puedas.
- Si alguien no respeta estas normas, escríbele a [@venturars](https://github.com/venturars).

## Qué contribuciones buscamos

Son bienvenidas:

- Correcciones de errores.
- Mejoras de las pantallas que ya existen, siguiendo la guía visual.
- Documentación: erratas, explicaciones que faltan o que han quedado desfasadas.
- Pruebas nuevas o mejores.

No se aceptan:

- Cambios de stack, de arquitectura o de base de datos sin una issue aprobada antes.
- Dependencias nuevas, o cambios de versión, sin una issue aprobada antes.
- Pull requests que no estén enlazadas a una issue.
- Cambios hechos a mano en `docs/guia/`: esa carpeta se genera sola.
- Código escrito por una IA que ninguna persona haya revisado.

## Reportar un error o proponer una idea

Todo empieza en una [issue](https://github.com/venturars/aTempo/issues). Busca antes si ya existe una parecida.

- **Título en inglés**, empezando por un verbo. Por ejemplo: `Fix the date on the attendance list`.
- **Descripción en español**, con estas tres partes:

```markdown
## Qué hay que hacer
Qué falla o qué falta, y qué debería pasar.

## Qué sigue igual
Lo que este cambio no toca.

## Cómo probarlo
Los pasos para comprobar que funciona.
```

- **Etiqueta** con el tipo de cambio: `feat`, `fix`, `docs` o `chore`.

Si es un error, añade en "Qué hay que hacer" los pasos para reproducirlo, qué esperabas y qué ha pasado. Una captura de pantalla ayuda mucho.

Espera a que te asignen la issue antes de empezar a programar. Así nadie trabaja dos veces en lo mismo y te aseguras de que el cambio encaja en el proyecto.

## Flujo de trabajo

1. **Haz un fork** del repositorio, o crea una rama si tienes permiso de escritura.
2. **Crea la rama** desde `staging` con el formato `número-tipo-descripción`. Por ejemplo: `72-fix-attendance-date`.
3. **Haz los commits** siguiendo las convenciones de abajo.
4. **Abre una pull request contra `staging`**, nunca contra `main`. En la descripción escribe `Closes #número` con el número de la issue.
5. **Revisión:** la pull request necesita dos aprobaciones, y una de ellas tiene que ser de un code owner. Si te piden cambios, súbelos a la misma rama.
6. **De `staging` a `main`:** cuando `staging` está lista, un code owner la lleva a `main`. No tienes que hacer nada.
7. **Versión:** cada cambio en `main` crea una versión nueva y su release. Una IA decide si es major, minor o patch a partir de los commits. Si la IA falla, deciden las reglas de los commits.

## Convenciones

Los commits siguen [Conventional Commits](https://www.conventionalcommits.org/es/v1.0.0/) y se escriben en inglés:

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

Los commits deciden la versión, así que el tipo importa:

- `feat` sube la versión minor (de 1.2.3 a 1.3.0).
- `fix` y el resto suben la versión patch (de 1.2.3 a 1.2.4).
- Un `!` después del tipo (`feat!:`) o `BREAKING CHANGE` en el cuerpo del commit suben la versión major (de 1.2.3 a 2.0.0). Úsalo solo si el cambio rompe algo que ya funcionaba.

## Cómo se escribe el código

Sigue lo que ya está escrito en [AGENTS.md](../AGENTS.md) y en la carpeta `docs/`. Esos documentos mandan sobre cualquier otra costumbre:

- [CONSTITUTION.md](CONSTITUTION.md): lo que ya está decidido para construir.
- [ARCHITECTURE.md](ARCHITECTURE.md): las tres capas del escritorio.
- [STYLE.md](STYLE.md): los temas y la guía visual.
- [TREE.md](TREE.md): dónde va cada carpeta de `desktop/`.

## Licencia

aTempo usa la licencia [Apache 2.0](../LICENSE). Al contribuir, aceptas que tu aportación se publique con esa misma licencia, como dice su sección 5.

Si reutilizas aTempo, tienes que conservar el aviso de [NOTICE](../NOTICE) y mencionar el proyecto original.
