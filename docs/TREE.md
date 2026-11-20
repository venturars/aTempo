# Árbol de almacenes

Cada almacén se instala y arranca en el ordenador. Compose orquesta los mismos procesos. No forman parte de `desktop/` ni de `api-router/`.

```text
postgres/
  README.md
  .env.example
  package.json
  pnpm-lock.yaml
  tsconfig.json
  drizzle.config.ts
  init/01_schema.sql
  test/run.sh
  test/valid.sql
sqlite/
  README.md
  schema.sql
  test/run.sh
  test/valid.sql
rustfs/
  README.md
  .env.example
  .gitignore
  create-bucket.sh
  package.json
  pnpm-lock.yaml
  scripts/run-start.mjs
  scripts/start.sh
  scripts/start.ps1
  scripts/create-bucket.mjs
  test/run.sh
blockend/
  README.md
  .env.example
  package.json
  hardhat.config.cjs
  contracts/CourseAttendance.sol
  abi/CourseAttendance.json
  sourcify/
  scripts/load-env.cjs
  scripts/publish-abi.cjs
  scripts/serve-abi.cjs
  scripts/deploy.cjs
  test/CourseAttendance.cjs
  test/publish-abi.cjs
docs/POSTGRES.md
docs/SQLITE.md
docs/RUSTFS.md
docs/BLOCKEND.md
permanent-data.md
```

# Árbol de `sdk/` (pendiente)

```text
sdk/                  # lógica de negocio; paquete aún no creado
```

# Árbol de `api-sqlite/`

```text
api-sqlite/
  pyproject.toml
  README.md
  api_sqlite/
    __init__.py
    __main__.py
    app.py
    config.py
    database.py
    health.py
  tests/
    test_health.py
```

# Árbol de `api-postgresql/`

```text
api-postgresql/
  package.json
  pnpm-lock.yaml
  .npmrc
  nest-cli.json
  tsconfig.json
  tsconfig.build.json
  eslint.config.mjs
  README.md
  src/
    main.ts              # puerto 3001, o PORT
    configure-app.ts     # CORS, ValidationPipe, Swagger /docs
    app.module.ts
    postgres/
      postgres.module.ts
      postgres.service.ts  # pg con DATABASE_URL; mock si no hay URL
      postgres-mock.ts     # filas de prueba para los listados
    health/
      health.module.ts
      health.controller.ts
      health-response.dto.ts
    person/
      person.module.ts
      person.controller.ts     # GET /person y GET /person/:id
      person.service.ts
      person-response.dto.ts
    course/
      course.module.ts
      course.controller.ts
      course.service.ts
      course-response.dto.ts
    person-role/
      person-role.module.ts
      person-role.controller.ts
      person-role.service.ts
      person-role-response.dto.ts
    person-course/
      person-course.module.ts
      person-course.controller.ts  # GET /person-course y DELETE /person-course/:personId/:courseId
      person-course.service.ts
      person-course-response.dto.ts
    organization/
      organization.module.ts
      organization.controller.ts
      organization.service.ts
      organization-response.dto.ts
  test/
    health.e2e-spec.ts
    course.e2e-spec.ts
    person.e2e-spec.ts
    person-role.e2e-spec.ts
    person-course.e2e-spec.ts
    organization.e2e-spec.ts
    swagger.e2e-spec.ts
    jest-e2e.json
```

# Árbol de `api-rustfs/`

```text
api-rustfs/
  package.json
  pnpm-lock.yaml
  .npmrc
  tsconfig.json
  tsconfig.build.json
  eslint.config.mjs
  README.md
  src/
    main.ts
    create-app.ts
    configure-app.ts
    health/
      health-router.ts
      health-response.ts
    rustfs/
      rustfs-config.ts
      check-rustfs.ts
    openapi/
      document.ts
  test/
    health.e2e-spec.ts
    swagger.e2e-spec.ts
    jest-e2e.json
```

# Árbol de `api-router/`

```text
api-router/
  package.json
  pnpm-lock.yaml
  .npmrc
  nest-cli.json
  tsconfig.json
  tsconfig.build.json
  eslint.config.mjs
  README.md
  src/
    main.ts
    configure-app.ts   # CORS, ValidationPipe, Swagger /docs
    app.module.ts
    health/
      health.module.ts
      health.controller.ts
      health-response.dto.ts
  test/
    health.e2e-spec.ts
    swagger.e2e-spec.ts
    jest-e2e.json
```

# Árbol de `desktop/`

```text
desktop/
  package.json
  pnpm-lock.yaml
  .npmrc
  electron.vite.config.ts
  electron-builder.yml
  playwright.config.ts
  eslint.config.mjs
  tsconfig.json
  tsconfig.node.json
  tsconfig.web.json
  README.md
  src/
    main/
      index.ts
      database.ts       # abre atempo.sqlite con node:sqlite
    preload/
      index.ts
      index.d.ts
    renderer/
      index.html
      src/
        main.tsx          # crea el router con hash history
        routeTree.gen.ts  # generado por el plugin de TanStack Router
        routes/
          __root.tsx    # ruta raíz; si no hay ruta, el login
          index.tsx     # /, login; ?invitation=<código> desde el correo de invitación
          student/
            dashboard.tsx  # /student/dashboard
            scan.tsx       # /student/scan, registrar asistencia
            history.tsx    # /student/history, historial
          organization/
            dashboard.tsx  # /organization/dashboard, Resumen de la organización
          teacher/
            panel.tsx      # /teacher/panel, PanelScreen
        env.d.ts          # tipo de VITE_STUDENT_SITE_URL
        styles/
          app.css       # importa docs/storybook/src/system.css
          fonts/        # Geist e Inter, woff2 con licencia OFL
        login/
          LoginScreen.tsx       # entrar, o elegir contraseña desde el enlace de una invitación
          loginStore.ts
          activateStore.ts      # contraseña nueva de una invitación
          invitations.ts        # invitaciones de ejemplo de profesor y alumno
          teacherAccounts.ts    # cuentas de profesor en memoria
          teacherDemoAccount.ts # cuenta pública de ejemplo del profesor
          validateLogin.ts
          validateActivation.ts
          trimesterExample.ts
          weekExample.ts        # semana de ejemplo del panel de la invitación
        navigation/
          BackButton.tsx        # volver a la pantalla anterior
        panel/
          AccountMenu.tsx    # menú de la cuenta con «Salir», abajo en la barra lateral
          AttendanceStatus.tsx
          DateFilter.tsx
          JustificationAccess.tsx
          MobileAttendance.tsx
          PanelScreen.tsx
          RecognitionAward.tsx
          RecognitionIcon.tsx
          SettingsView.tsx
          StatsView.tsx
          StudentHistory.tsx
          avatar.tsx
          classCode.ts       # código y enlace del QR de cada periodo de 30 s
          markControl.tsx
          markCorrection.tsx # motivo de un cambio con la lista cerrada
          marks.ts
          panelStore.ts
          riskHint.tsx
          roster.ts
          sessionQr.tsx      # QR real y código de 6 cifras
          settingsStore.ts
          studentSite.ts     # dirección del sitio del alumno que abre el QR
        organization/
          OrganizationDashboardScreen.tsx
          organizationExample.ts
        student/
          NoStudentSession.tsx # aviso cuando la sesión no es de un alumno con cuenta
          attendanceStatus.ts  # estado de asistencia y margen de tarde
          studentAccounts.ts   # cuentas de alumno en memoria y cuenta de la sesión
          studentExample.ts    # cuenta de ejemplo, clase de hoy y lecturas del QR
          dashboard/
            DashboardScreen.tsx
          scan/
            ScanScreen.tsx     # clase de hoy y lector con lecturas de ejemplo
          history/
            HistoryScreen.tsx  # clases de la cuenta con hora y estado
        session/
          sessionStore.ts  # perfil, correo y nombre en memoria, salir y ruta de su dashboard
        underConstruction/
          UnderConstructionScreen.tsx  # pantalla provisional con título
  tests/
    helpers/
      electron.ts          # arranque oculto y cierre auditado en macOS
      hidden-electron.cjs  # guardas antes de cargar el main construido
      hidden-preflight.cjs # comprobación de ventanas en fuente y build
      hidden-watchdog.cjs  # observador de primer plano y procesos propios
    hidden-electron.spec.ts # smoke del build real: entrada, navegación y captura
    login.spec.ts
    teacher-login.spec.ts # acceso con la cuenta pública del profesor
    teacher-account.spec.ts # activar invitaciones y salir
    teacher-corrections.spec.ts # cambios con la lista cerrada, motivo, registro y volver
    panel.spec.ts
    teacher-qr.spec.ts  # QR legible, código de 6 cifras, periodos del reloj, llegadas y dos temas a 390/1280 px
    organization-dashboard.spec.ts
    dashboard.spec.ts
    navigation.spec.ts  # rutas, flags de arranque y dashboard de cada perfil
    student.spec.ts     # acceso del alumno con la cuenta de ejemplo o una invitación, escaneo, historial y estado de asistencia; escaneo e historial en ambos temas a 390/1280 px (fuentes, espaciado y desbordamiento)
    visual-system.spec.ts  # paridad de Storybook y escritorio, temas y rutas
    snapshots/
      login-empty.png
      login-errors.png
      login-alert.png
      login-narrow.png
      login-claro.png
      dashboard-empty.png
      panel-hoy.png
      panel-sesiones.png
      panel-estadisticas.png
      panel-ajustes.png
      panel-estadisticas-movil.png
      panel-claro.png
      panel-ficha.png
      dashboard-normal-atempo-oscuro-1280.png
      dashboard-normal-atempo-oscuro-390.png
      dashboard-normal-atempo-claro-1280.png
      dashboard-normal-atempo-claro-390.png
      navigation-organization-dashboard.png
      navigation-teacher-panel.png
      teacher-qr-oscuro-desktop.png
      teacher-qr-claro-desktop.png
      teacher-qr-oscuro-movil.png
      teacher-qr-claro-movil.png
      student-dashboard-390.png
      student-scan-390.png
      student-scan-confirmed-390.png
      student-history-empty-390.png
      student-history-390.png
  build/                # iconos de empaquetado de la plantilla
  resources/            # icono de la ventana en Linux
```
