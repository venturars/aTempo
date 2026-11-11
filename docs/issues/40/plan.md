## Plan

### Análisis de impacto

- **Archivos a modificar:** `README.md` para documentar configuración, ejecución y límites de la automatización.
- **Archivos a crear:** workflows bajo `.github/workflows/`, módulo de automatización bajo `.github/scripts/discord-pr-notifications/` y sus tests.
- **Fuera del cambio:** `desktop/`, `docs/storybook/` y la base SQLite.

### Diseño técnico

- Separar el disparador de PR, sin secretos, del emisor privilegiado. El primero escucha las solicitudes de revisión y el paso a lista para revisión; no ejecuta código de la PR. El segundo se activa con `workflow_run` desde la rama predeterminada `main`, usa el entorno protegido restringido a esa rama y vuelve a consultar GitHub para verificar repositorio, PR, base `staging`, estado y dos revisores distintos. Trata todo dato procedente del disparador o sus artefactos como no confiable; nunca hace checkout ni ejecuta código de la PR. Ambos workflows deben existir en las ramas donde GitHub exige su presencia antes de una prueba real.
- En el emisor, leer `DISCORD_BOT_TOKEN` como secreto del entorno; leer `DISCORD_GUILD_ID=1559533384894648340` y `DISCORD_GIT_CHANNEL_ID=1559906683008843806` como variables del entorno. El administrador de aTempo debe crear y restringir el entorno y configurar esos valores antes del ensayo real. Añadir un secreto independiente `DISCORD_CACHE_KEY`: 32 bytes aleatorios codificados en base64, para cifrar cada fichero de relaciones guardado como artefacto entre ejecuciones. Cada ejecución guarda su artefacto propio durante dos días. Al restaurar, listar todos los artefactos vigentes de relaciones, no solo el más reciente; descifrar y fusionar sus entradas aún válidas por fecha de guardado hasta las 48 horas. Conservar coincidencias iguales; ante IDs distintos para un login, exigir nueva resolución exacta en lugar de escoger el último. Un artefacto ausente, ilegible o manipulado no confirma ninguna identidad.
- Separar la lectura del evento, la resolución de identidades, la caché y el envío. Consultar las relaciones vigentes; si falta alguna, buscar a ambos revisores. Comparar cada login de GitHub con el nombre de usuario de Discord mediante igualdad exacta, exigir una coincidencia por login y dos IDs distintos. No publicar si falla una identidad.
- Construir un mensaje breve con título o descripción resumida y URL de la pull request. Restringir las menciones a los dos IDs resueltos. Usar una clave estable de PR y pareja ordenada para un registro duradero cifrado en un comentario técnico de esa PR, separado de la caché de 48 horas; requiere `issues:write`. Comprobarlo antes de enviar y actualizarlo solo tras éxito. Serializar los intentos de la misma PR. Si Discord confirma el envío pero falla la escritura del comentario, señalar el estado incierto: un nuevo intento podría duplicar el mensaje y necesita comprobación previa.
- Usar permisos mínimos de `GITHUB_TOKEN`, fijar las acciones externas a revisiones inmutables y no incluir secretos en logs ni artefactos. Registrar diagnósticos de configuración, identidad o API sin datos sensibles.

### Estrategia de testing

- **Unitarios:** `node:test` y `node:assert/strict` para caducidad, coincidencia exacta, ambigüedad, cifrado e integridad del fichero, composición del mensaje y clave de duplicado.
- **Lógica de negocio:** `node:test` con clientes GitHub/Discord simulados para los cinco escenarios y los casos de borde, incluida la recuperación de dos artefactos guardados en paralelo, la verificación de datos no confiables y la recuperación tras fallo.
- **UI:** No aplica.
- **Punta a punta:** Prueba real posterior a la configuración del entorno por el administrador y al despliegue de ambos workflows en las ramas necesarias; solicitar dos revisores identificables en una PR a `staging`, repetir el evento y comprobar un único mensaje en `#git`. Este paso no bloquea la ejecución local de tests, pero sí la aceptación operativa.
- **Comando:** `node --test .github/scripts/discord-pr-notifications/*.test.mjs`; el proyecto no tiene un comando de tests para esta automatización.

### Riesgos y mitigaciones

- **Riesgo:** Una PR pública suministra datos manipulados al emisor con secretos. **Mitigación:** `workflow_run` en `main`, revisión de la PR actual por API y prohibición de ejecutar código o instrucciones de artefactos no confiables.
- **Riesgo:** El fichero de caché queda legible en artefactos del repositorio público. **Mitigación:** cifrado autenticado con `DISCORD_CACHE_KEY`, vencimiento comprobado al leer y retención de dos días.
- **Riesgo:** Dos PR simultáneas restauran el mismo artefacto y guardan ficheros divergentes; restaurar solo el último pierde relaciones. **Mitigación:** conservar un artefacto por ejecución y fusionar todas las relaciones vigentes al leer, con prueba de ambos órdenes de finalización; los conflictos de identidad se vuelven a resolver.
- **Riesgo:** Dos ejecuciones envían el mismo aviso o se produce un fallo entre publicar y registrar. **Mitigación:** serializar por PR, mantener un registro duradero aparte de la caché y probar la recuperación. Si falla el registro después de un envío aceptado, no hay garantía automática de ausencia de duplicados; señalarlo para comprobación antes del reintento.
- **Riesgo:** Resolver a otra persona por nombres visibles o coincidencias parciales. **Mitigación:** comparar solo el nombre de usuario exacto y exigir un resultado único.
- **Riesgo:** El entorno protegido aún no tiene token, clave o IDs, o los workflows aún no están en las ramas necesarias. **Mitigación:** validar y documentar la configuración; hacer primero tests locales y posponer la prueba real hasta que estén disponibles.

### Capas

- No aplica: la automatización queda fuera de las tres capas de la aplicación de escritorio descritas en `docs/ARCHITECTURE.md`.

### Traducción a tests

- **Escenario 1:** Aviso de dos revisores identificados → `.github/scripts/discord-pr-notifications/notify.test.mjs::publica_un_aviso_con_dos_menciones`
- **Escenario 2:** Evento repetido → `.github/scripts/discord-pr-notifications/notify.test.mjs::ignora_evento_repetido`
- **Escenario 3:** Identidad ausente o ambigua → `.github/scripts/discord-pr-notifications/notify.test.mjs::falla_sin_publicar_si_falta_identidad`
- **Escenario 4:** Vigencia de las relaciones → `.github/scripts/discord-pr-notifications/notify.test.mjs::caduca_relacion_a_las_48_horas`
- **Escenario 5:** Relaciones guardadas en ejecuciones simultáneas → `.github/scripts/discord-pr-notifications/state.test.mjs::fusiona_artefactos_de_pr_simultaneas`

### Comprobación de concepto

- **Documento:** `README.md`
  - **Frase:** La automatización usa GitHub Actions y el bot existente; el administrador configura el entorno protegido y el aviso solo se publica en `#git` tras identificar inequívocamente a los dos revisores.
  - **Código:** workflows de `.github/workflows/` y `.github/scripts/discord-pr-notifications/notify.mjs`.

### Estilo

- Código y textos UTF-8; comentarios cortos que expliquen la funcionalidad nueva, nombres claros y una responsabilidad por función, según `AGENTS.md`.
- Las reglas visuales de `docs/STYLE.md` no aplican a un workflow sin pantalla. No hay linter ni formateador configurados para esta automatización; comprobar el formato de YAML y el código en la ronda de implementación.
