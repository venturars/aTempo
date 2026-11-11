## Tasks

### Fase 1: Preparación

- [x] **TASK-01:** Registrar H-01 como resuelto con los nombres de configuración, los IDs confirmados y la separación de pruebas locales y ensayo real.
  - **Agente:** `concept-developer`
- [x] **TASK-02:** Preparar los workflows de disparo sin secretos y de emisión en `main` con `workflow_run`, entorno protegido, permisos mínimos y comprobación de datos de la PR por API.
  - **Agente:** `code-developer`

### Fase 2: Implementación

- [ ] **TASK-03:** Implementar el fichero cifrado de relaciones entre ejecuciones, caducidad de 48 horas, retención de dos días y registro duradero de avisos para evitar duplicados.
  - **Agente:** `code-developer`
- [ ] **TASK-04:** Implementar la resolución exacta y única de los dos revisores y el fallo sin publicación ante ausencias, ambigüedades o errores.
  - **Agente:** `code-developer`
- [ ] **TASK-05:** Implementar el mensaje del bot con dos menciones controladas, resumen, enlace y envío al canal confirmado.
  - **Agente:** `code-developer`
- [ ] **TASK-06:** Actualizar `README.md` con la configuración del administrador, comportamiento real y requisitos de despliegue de los workflows.
  - **Agente:** `concept-developer`
- [ ] **TASK-12:** Corregir la restauración de relaciones para reunir todos los artefactos vigentes de ejecuciones simultáneas, resolver conflictos sin suponer una identidad y probar que ningún orden de finalización pierde relaciones.
  - **Agente:** `code-developer`

### Fase 3: Verificación local

- [ ] **TASK-07:** Escribir y ejecutar tests unitarios y de lógica de negocio para los escenarios, cifrado, datos no confiables y casos de borde.
  - **Agente:** `code-tester`
- [ ] **TASK-08:** Comprobar que `README.md` y la spec describen lo que hace el código.
  - **Agente:** `concept-tester`
- [ ] **TASK-09:** Comprobar sintaxis, tipos y formato de los archivos nuevos.
  - **Agente:** `code-developer`

### Fase 4: Configuración y ensayo real

- [ ] **TASK-10:** Configurar el entorno protegido para la rama de confianza con `DISCORD_BOT_TOKEN`, `DISCORD_CACHE_KEY`, `DISCORD_GUILD_ID` y `DISCORD_GIT_CHANNEL_ID`.
  - **Agente:** administrador de aTempo.
- [ ] **TASK-11:** Tras desplegar los workflows en las ramas requeridas, solicitar dos revisores identificables en una PR a `staging`, repetir el evento y comprobar un solo aviso en `#git`.
  - **Agente:** `code-tester`
