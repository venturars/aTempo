# AGENTS.md — Manual de trabajo para agentes de IA

Vamos a desarrollar una app para registrar la asistencia (aTempo) de los alumnos de una clase. Sigue la [constitución](docs/CONSTITUTION.md). Este proyecto se trabaja con spec-driven development (SDD).

Antes de construir una pantalla, lanza `pnpm guide` desde `docs/storybook` y lee [docs/guia](docs/guia/README.md).

## Guía visual

Storybook, en `docs/storybook`, es la fuente de verdad. El markdown de [docs/guia](docs/guia/README.md) sale de esa fuente y no se versiona. Los agentes leen el markdown.

Si cambias cualquier cosa de `docs/storybook` (historias, reglas, tema o vista previa), es obligatorio volver a lanzar el generador:

```sh
cd docs/storybook
pnpm guide
```

`pnpm guide:check` tiene que salir bien antes de dar el cambio por terminado. No edites `docs/guia/` a mano.

## 1. Principios Generales del Sistema

- **Fidelidad al SDD:** Ningún agente puede proponer cambios arquitectónicos, de stack o de base de datos que contradigan el SDD activo sin aprobación previa.
- **Modularidad:** Cada agente tiene un alcance (scope) delimitado. No deben invadir las responsabilidades de otros agentes.
- **Trazabilidad:** Toda acción, código generado o decisión debe estar vinculada a un requisito o sección específica del SDD.

---

## 2. Cómo implementar una spec

Para implementar una spec se sigue este orden. Cada paso espera a que el anterior esté hecho.

1. Localiza la issue y entiende la tarea que hay que resolver.
2. Lee la [constitución](docs/CONSTITUTION.md).
3. Investiga cómo se debe resolver la tarea.
4. Sube a la issue los artefactos `spec.md`, `plan.md` y `tasks.md`.
5. Desarrolla la tarea.
6. Prueba lo desarrollado.
7. Commitea los cambios en GitHub.

## 👥 2. Catálogo y Definición de Agentes

Todavía no hay sub-agentes

## 3. Reglas de comportamiento

El humano solo lee la issue y la pull request.

- Toda pregunta, y todo plan que necesite ayuda humana, se debe reflejar en la issue al momento de crearla.
- Si no ha sido posible dejarlo ahí y quedan definiciones o dudas, se escriben en un `questions.md`. Ese archivo se sube como artefacto a la issue.
- El humano responde el `questions.md` antes de la implementación. Si no hay respuesta, no se implementa.

## 4. Cómo se escribe el código

Cada herramienta se usa como dice su documentación original. No se inventa un estilo propio ni se copia el de otro proyecto.

El código tiene que poder leerlo un junior sin experiencia: nombres que dicen qué hacen, una cosa por función y un flujo que se sigue sin adivinar.
