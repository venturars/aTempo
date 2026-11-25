# Demo de aTempo

El recorrido completo con datos de ejemplo: administración, profesor y alumno, desde la invitación hasta la llegada tarde. Funciona en `staging` sin Docker, Auth0 ni `.env`. La administración y la app del profesor vuelven al ejemplo al recargar o cerrar. La web del alumno guarda en el navegador las cuentas activadas, las entradas y los avisos: para repetir la demo, abre antes <http://localhost:5191/?reiniciar>.

## Arrancar

Con Node 24 y pnpm 10.33.0, desde la raíz del repositorio:

```sh
pnpm run demo:install
```

Solo hace falta la primera vez y después de cada `git pull`. Instala las dependencias de `web/` y `desktop/`.

Abre dos terminales en la raíz:

```sh
pnpm run demo:web
```

```sh
pnpm run demo:desktop
```

La primera sirve la web del alumno y la administración en <http://localhost:5191>. La segunda abre la app del profesor.

## 1. Administración

1. Abre <http://localhost:5191/admin> y pulsa **Crear cuenta**.
2. Rellena la organización, su CIF (9 caracteres, por ejemplo `B12345678`) y tus datos: nombre, apellidos, documento de identidad (por ejemplo `12345678Z`), correo y una contraseña de al menos 8 caracteres. Pulsa **Crear cuenta**: entras en la administración vacía de tu organización.
3. Pulsa **Cerrar sesión** y entra con la organización de ejemplo: `miguel@neoland.example` / `neoland-2026`. Tiene personas, cursos y sesiones.
4. En **Personas**, pulsa **Invitar persona** e invita a un profesor o a un alumno. Queda con **Invitación pendiente**.
5. En **Cursos**, crea un curso, ábrelo y pulsa **Programar sesión**.

El correo de invitación no se envía todavía. Los dos pasos siguientes abren el enlace que llevaría ese correo.

## 2. Profesor invitado

Cierra la app del profesor (**Cmd+Q** en macOS) y ábrela con el enlace de invitación de Lucía Martín:

```sh
pnpm run demo:desktop -- --invitation=731905
```

1. En **Hola, Lucía**, elige una contraseña de al menos 8 caracteres y pulsa **Entrar**. Se abre **Hoy**.
2. Pulsa tu nombre al pie de la barra lateral y **Cerrar sesión**. Vuelve a entrar con `lucia.martin@atempo.test` y tu contraseña.

Sin invitación, el profesor de ejemplo entra con `profesor@atempo.test` / `Profesor123!`.

## 3. Alumno invitado

1. Abre <http://localhost:5191/?invitation=264018>. Es el enlace de invitación de Bruno Sanz. Si dice que la invitación ya está activada, abre antes <http://localhost:5191/?reiniciar>.
2. El nombre y los apellidos vienen de la invitación. Completa el documento de identidad (por ejemplo `87654321X`), elige una contraseña de al menos 8 caracteres y pulsa **Entrar**. Se abre su inicio con Tempito.

El alumno de ejemplo entra en <http://localhost:5191/> con `ada.lopez@clase.test` / `clase-2026`.

## 4. Tempito antes de clase

La clase de ejemplo empieza a las 09:00. Con `?hora=` el inicio del alumno simula otra hora de hoy:

| Abre | Tempito |
| --- | --- |
| <http://localhost:5191/student/dashboard?hora=08:40> | Tranquilo, con gafas de sol: llega con tiempo. |
| <http://localhost:5191/student/dashboard?hora=08:57> | Corre: faltan menos de 5 minutos. |
| <http://localhost:5191/student/dashboard?hora=08:59:45> | Agobiado en los últimos 30 segundos. Espera y verás cómo cambia a las 09:00. |
| <http://localhost:5191/student/dashboard?hora=09:05> | Corre con pánico: ya llega tarde. |

`?hora=` y `?dia=` solo funcionan con `pnpm run demo:web`. Fuera de lunes a viernes no hay clase: añade `&dia=lun` para verla.

## 5. Aviso de retraso

1. En la web del alumno, pulsa **Avisar** y elige **Llego tarde**.
2. Pon `09:30` como hora de llegada, un motivo si quieres y pulsa **Enviar**.
3. El inicio dice «Avisaste que llegas a las 09:30».
4. Abre <http://localhost:5191/student/dashboard?hora=09:20>. Sin el aviso, Tempito correría con pánico; con él cuenta hasta las 09:30 y sigue tranquilo.

**No puedo ir** avisa de una ausencia y admite un justificante.

## 6. QR y entrada

1. En la app del profesor, en **Hoy**, pulsa **Abrir lista**. Aparecen el QR de la clase y un código de 6 cifras, que cambian cada 30 segundos.
2. En la web del alumno, pulsa **Registrar asistencia**. Escanea el QR con la cámara, o pulsa **Escribir el código** y teclea las 6 cifras.
3. Aparece «Disfruta la clase» con la hora de entrada, y el inicio cambia a «En clase desde las …».
4. En **Resumen** está la entrada de hoy. La entrada guarda la hora real: después de las 09:10 queda como **Tarde**.

Para escanear con el móvil, el móvil y el ordenador deben estar en la misma wifi. Arranca el profesor con la IP del ordenador:

```sh
VITE_STUDENT_SITE_URL=http://<ip-del-ordenador>:5191 pnpm run demo:desktop
```

y la web con `pnpm run demo:web -- --host`.

La web y la app del profesor todavía no comparten datos: la entrada del alumno no aparece en la lista del profesor hasta que exista el backend. En la lista, **Simular llegada** hace ese papel.

## 7. Llegada tarde y corrección

1. En la app del profesor, con la lista abierta, pulsa **Simular llegada** varias veces. Cada alumno entra con su hora de ejemplo y queda **Presente** o **Tarde** según el inicio de la clase y el margen de **Ajustes**.
2. Pulsa **Cerrar lista** y confirma. Los que no llegaron pasan a **Ausente**.
3. En la fila de un alumno que llegó tarde, abre su estado y elige **Presente**. Se abre «Cambiar a Presente»: escribe el motivo y pulsa **Guardar**.
4. Pasa el ratón por encima del estado: se ve quién lo cambió, cuándo y por qué.

## Volver a empezar

- Web: abre <http://localhost:5191/?reiniciar>. Borra las cuentas activadas, las entradas y los avisos de este navegador.
- Administración: recarga la página.
- Profesor: sal con **Cmd+Q** y vuelve a ejecutar `pnpm run demo:desktop`.
