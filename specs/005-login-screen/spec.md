# 005 — Pantalla de login

Issue: https://github.com/venturars/aTempo/issues/5

## Problema

El profesor abre aTempo de escritorio y todavía no tiene una puerta de entrada. Hace falta una pantalla de login, solo con correo y contraseña, para ver que el marco de escritorio ya existe.

## Usuarios

El profesor, en el ordenador de la clase.

## Historias

- Como profesor, quiero ver una pantalla de login con correo y contraseña para saber dónde entro.
- Como profesor, quiero que un correo vacío, un correo mal formado o una contraseña vacía me digan qué falta, en texto.
- Como profesor, quiero que unos datos válidos me muestren un alert con el correo y la contraseña que acabo de escribir.

## Criterios de aceptación

### CA-01 Pantalla inicial

Dado que abro la aplicación, cuando aparece la primera pantalla, entonces veo el título aTempo, la línea «Entra con tu correo.», los campos Correo y Contraseña con su etiqueta, y el botón Entrar. No veo errores ni alert.

La captura de esta comprobación es `login-empty.png`.

### CA-02 Campos vacíos

Dado que los dos campos están vacíos, cuando pulso Entrar, entonces leo «El correo es obligatorio.» y «La contraseña es obligatoria.». No aparece el alert.

La captura de esta comprobación es `login-errors.png`.

### CA-03 Correo mal formado

Dado que escribo `ana` en el correo y `secreta` en la contraseña, cuando pulso Entrar, entonces leo «El correo no tiene una forma válida.». No aparece el alert.

### CA-04 Datos válidos

Dado que escribo `ana@clase.test` en el correo y `secreta` en la contraseña, cuando pulso Entrar, entonces el alert muestra esos dos datos. La pantalla no cambia y no se guarda nada.

La captura de esta comprobación es `login-alert.png`.

## Fuera de alcance

- No hay sesión, ni registro, ni recuperación de contraseña.
- No hay otra pantalla después del alert.
- SQLite se abre con la aplicación, pero el login no la consulta.

## Prueba visual

Se ejecuta desde `desktop/` con `pnpm run test:visual`. El detalle del comando y de las capturas está en [docs/STYLE.md](../../docs/STYLE.md).
