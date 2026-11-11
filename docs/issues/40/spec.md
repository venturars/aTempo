## Spec

> Estado: **Borrador** · Creada: 2026-11-11 · Aprobada: —

### Metadata

- **Componente(s) Afectado(s):** automatización de GitHub Actions, integración con Discord y documentación de uso.
- **Impacto:** Medio.

### Requerimientos funcionales

- [ ] **RF-01:** Cuando se solicite revisión a dos compañeros en una pull request lista para revisión, el bot de Discord existente publicará un único aviso en `#git`.
- [ ] **RF-02:** El aviso mencionará a ambos revisores, resumirá brevemente la pull request y contendrá su enlace.
- [ ] **RF-03:** Un fichero de caché reutilizable entre ejecuciones relacionará logins de GitHub con IDs de Discord. Cada relación caducará a las 48 horas. Si dos pull requests se procesan a la vez, las relaciones válidas guardadas por ambas seguirán recuperables.
- [ ] **RF-04:** Si falta una relación vigente, se buscará a los dos revisores. Solo se guardará automáticamente una coincidencia exacta y única entre el login de GitHub y el nombre de usuario de Discord.
- [ ] **RF-05:** Si alguna relación sigue ausente o es ambigua, no se publicará el aviso y el workflow señalará qué identidad no pudo resolver y por qué.
- [ ] **RF-06:** Una repetición del evento para la misma pull request y la misma pareja de revisores no publicará otro aviso.

### Requerimientos no funcionales (límites)

- [ ] **RNF-01:** La automatización se ejecutará mediante GitHub Actions, sin alojarse en un VPS personal ni modificar la aplicación de escritorio.
- [ ] **RNF-02:** Se reutilizará el bot existente. Su token no se incluirá en el repositorio, artefactos, caché ni logs. Solo el emisor en una rama de confianza podrá acceder al entorno protegido que lo guarda.
- [ ] **RNF-03:** El texto de la pull request no podrá generar menciones adicionales a las dos identidades verificadas.
- [ ] **RNF-04:** Los datos de identidad conservados entre ejecuciones no quedarán legibles en los artefactos públicos del repositorio.

### Criterios de aceptación

- **Escenario 1:** Aviso de dos revisores identificados
  - **Dado que:** Una pull request está lista para revisión y ambos revisores tienen una relación vigente o una coincidencia exacta y única en Discord.
  - **Cuando:** Se solicita su revisión.
  - **Entonces:** Aparece un solo mensaje en `#git` con las dos menciones, un resumen breve y el enlace de la pull request.
- **Escenario 2:** Evento repetido
  - **Dado que:** Ya se publicó el aviso para una pull request y la misma pareja de revisores.
  - **Cuando:** Se repite el evento.
  - **Entonces:** No aparece otro mensaje.
- **Escenario 3:** Identidad ausente o ambigua
  - **Dado que:** Al menos un revisor no tiene relación vigente y su búsqueda no produce una única coincidencia exacta.
  - **Cuando:** Se intenta preparar el aviso.
  - **Entonces:** No se publica ningún mensaje y el workflow indica la incidencia.
- **Escenario 4:** Vigencia de las relaciones
  - **Dado que:** Existe una relación confirmada en el fichero de caché.
  - **Cuando:** Se consulta antes y después de cumplir 48 horas desde su guardado.
  - **Entonces:** Se reutiliza antes del vencimiento y se vuelve a resolver tras vencer.
- **Escenario 5:** Relaciones guardadas en ejecuciones simultáneas
  - **Dado que:** Dos ejecuciones de distintas pull requests parten del mismo estado de relaciones y confirman relaciones diferentes.
  - **Cuando:** Ambas guardan su estado y una ejecución posterior recupera la caché.
  - **Entonces:** Las dos relaciones vigentes siguen disponibles sin depender del orden en que terminaron las ejecuciones.

### Casos de borde y errores

- [ ] **CB-01:** Si la pull request está en borrador o aún no constan dos revisores distintos, no se publica un aviso incompleto.
- [ ] **CB-02:** Si falla la lectura de GitHub, Discord o la caché, no se infiere una identidad ni se publica un mensaje parcial; el workflow informa del fallo.
- [ ] **CB-03:** Un fallo al enviar el mensaje no queda registrado como aviso publicado, para permitir un nuevo intento.
- [ ] **CB-04:** Los datos de un evento o artefacto iniciado desde una pull request se vuelven a comprobar en GitHub antes de que el job con secretos actúe; nunca se ejecuta código de esa pull request en el job privilegiado.
- [ ] **CB-05:** Si Discord acepta el mensaje pero falla la escritura del registro en GitHub, el workflow señalará que el estado del aviso es incierto. Un reintento podría duplicarlo y requiere comprobación antes de repetir el envío.
- [ ] **CB-06:** Si dos artefactos vigentes contienen IDs de Discord distintos para el mismo login, no se escoge uno por orden de publicación; se vuelve a comprobar esa identidad y no se publica si sigue siendo ambigua.

### Huecos

- **H-01 resuelto:** El administrador de aTempo configurará el token del bot existente como secreto `DISCORD_BOT_TOKEN` de un entorno protegido de GitHub Actions restringido a la rama de confianza. El servidor es `1559533384894648340` y el canal `#git` es `1559906683008843806` ([enlace](https://discord.com/channels/1559533384894648340/1559906683008843806)); sus IDs se configurarán como variables `DISCORD_GUILD_ID` y `DISCORD_GIT_CHANNEL_ID` del mismo entorno. La configuración efectiva es requisito de la prueba real, no de la implementación ni de las pruebas locales.

### Documentos que mandan

- `docs/CONSTITUTION.md`
- `docs/ARCHITECTURE.md`
- `docs/STYLE.md`
- `AGENTS.md`
- `README.md`
