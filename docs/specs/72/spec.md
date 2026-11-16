# Avisos optativos de PR en Discord

La issue [#72](https://github.com/venturars/aTempo/issues/72) incorpora el aviso de PR sin cambiar la aplicación de escritorio ni los pasos de los agentes.

## Comportamiento

- Al abrir una PR hacia `staging`, solicitar revisión o marcarla lista para revisión, se anuncia cuando tiene al menos dos revisores solicitados.
- El mensaje muestra el repositorio, un resumen, el enlace y los logins de GitHub. Solo menciona cuentas de Discord verificadas.
- Un comentario autorizado `/discord-map LOGIN_GITHUB ID_DISCORD` puede confirmar una asociación y generar una mención adicional. La asociación cifrada caduca a las 48 horas.
- Una PR cerrada, en borrador o con menos de dos revisores se omite. La repetición de un evento no duplica el aviso.

## Límites de confianza

- El workflow se ejecuta desde la rama predeterminada `main` con `pull_request_target` o `issue_comment`, aunque la PR apunte a `staging`.
- La acción compartida está fijada a un SHA completo de `delivery-workflow`. Comprueba el evento y vuelve a consultar la PR antes de usar el bot.
- El job usa el entorno protegido `Discord-PR-Notifications`, limitado a `main`. No descarga ni ejecuta código de la PR.
- aTempo y `delivery-workflow` conservan cachés y registros independientes.
