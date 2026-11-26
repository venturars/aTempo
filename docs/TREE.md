# Árbol de `web/`

```text
web/
  package.json           # Vite, React y TanStack Router; pnpm 10.33.0
  pnpm-lock.yaml
  README.md              # inicio de sesión Auth0, admin y portal del alumno
  src/
    admin/
      adminStore.ts      # CRUD mock de organización, personas, cursos y sesiones
      AdminLayout.tsx    # panel Auth0, navegación, tema y salida
      AdminHome.tsx
      PeopleScreen.tsx
      CoursesScreen.tsx
      CourseDetails.tsx  # detalle reutilizado para gestión y Mis clases
      SessionDetails.tsx # listado pendiente del curso
      PersonForm.tsx     # creación y edición de personas
      CourseForm.tsx     # creación y edición de cursos
      SessionForm.tsx    # creación y edición de sesiones
      DeleteConfirmation.tsx # confirmación compartida de borrado
      adminUi.tsx
    shared/
      ThemeToggle.tsx    # control existente compartido con StudentLayout
    routes/
      admin.tsx
      admin/
        index.tsx
        people.tsx
        courses/index.tsx
        courses/$courseId.tsx
        sessions/$sessionId.tsx
        my-classes/index.tsx
        my-classes/$courseId.tsx
        my-classes/$courseId.index.tsx
        my-classes/$courseId.$sessionId.tsx
      student/           # pantallas del portal del alumno
    student/             # vistas, datos y layout del alumno
    session/             # sesión recuperada del router y rutas protegidas
    styles/app.css       # importa el sistema visual de Storybook
    routeTree.gen.ts     # generado por Vite, no se edita a mano
```

Las pruebas focales de admin están en `desktop/tests/admin-store.spec.ts` y `desktop/tests/admin-web.spec.ts`, con `desktop/playwright.admin.config.ts`.

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
  init/02_unique_lower.sql
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

# Árbol de `sdk/`

```text
sdk/
  README.md
  package.json           # atempo-sdk; pnpm 10.33.0; no es un servicio HTTP
  pnpm-lock.yaml
  tsconfig.json
  tsconfig.build.json
  eslint.config.mjs
  .prettierrc
  src/
    index.ts
    shared/
      result.ts          # Result ok | err
      app-error.ts       # VALIDATION, CONFIGURATION, PERSISTENCE, CONFLICT, NOT_FOUND
    domain/
      email.ts             # Email
      identifier.ts        # TaxId, IdentificationDocument
      text.ts              # NonEmptyText, Phone
      invitation-status.ts
      scalars.ts           # Uuid, DateOnly
      person-record.ts     # tabla person
      person-role.ts       # tabla person_role
      person.ts            # OrganizationPerson = record + roles
      organization.ts
      person-repository.ts
    application/
      after-auth.ts
      create-organization.ts
      invite-person.ts
      directory.spec.ts
      after-auth.spec.ts
    infrastructure/
      postgres-health-client.ts
      in-memory-person-repository.ts
    composition/
      create-sdk.ts
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
      person-course.controller.ts  # GET, POST /person-course y DELETE /person-course/:personId/:courseId
      person-course.service.ts
      person-course-response.dto.ts
      create-person-course.dto.ts
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
  package.json           # dependencia file:../sdk (atempo-sdk)
  pnpm-lock.yaml
  .npmrc
  nest-cli.json
  tsconfig.json
  tsconfig.build.json
  eslint.config.mjs
  README.md
  src/
    main.ts
    configure-app.ts   # CORS, ValidationPipe, filtro de errores del contrato, Swagger /docs
    app.module.ts      # carga mock-api/ con API_MOCK=true; AuthService llama afterAuth
    contract/
      contract-exception.ts        # errores con el formato del contrato
      contract-exception.filter.ts # responde con ese formato
    health/
      health.module.ts
      health.controller.ts
      health-response.dto.ts
    shared/
      cookies.ts             # lectura, atributos y borrado de cookies Auth0
      atempo-sdk.token.ts
      atempo-sdk.module.ts   # createSdk() global; ATEMPO_SDK
      bearer.guard.ts        # Bearer no vacío (admin y mock-api)
    auth/
      auth.module.ts
      auth.controller.ts
      auth.service.ts        # Auth0; afterAuth tras login, register y me; 503 solo CONFIGURATION/PERSISTENCE; VALIDATION → 400
      web-session.dto.ts     # perfil web público
      web-session.service.ts # allowlist web y perfil; tokens en cookies HttpOnly
      login-request.dto.ts
      login-response.dto.ts
      register-request.dto.ts
      register-response.dto.ts
      logout-request.dto.ts
      logout-response.dto.ts
      refresh-request.dto.ts
      refresh-response.dto.ts
      me-response.dto.ts
    organization/
      organization.module.ts
      organization.controller.ts
      organization.service.ts
    person/
      person.module.ts
      person.controller.ts
      organization-people.controller.ts
      person.service.ts
    mock-api/
      mock-api.module.ts
      sessions.controller.ts # /sessions del contrato API v1
      courses.controller.ts  # /courses/:courseId/students
      mock-api.service.ts    # estado en memoria y reglas del contrato
      dto.ts
      sample-data.ts         # clase y alumnos de ejemplo
  test/
    health.e2e-spec.ts
    mock-api.e2e-spec.ts
    swagger.e2e-spec.ts
    auth.e2e-spec.ts
    auth-web.e2e-spec.ts
    organizations.e2e-spec.ts
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
      routerRequest.ts  # peticiones del cliente de la API al router, con el token
    preload/
      index.ts
      index.d.ts
      router.d.ts       # mensajes entre el cliente de la API y main
    renderer/
      index.html
      src/
        main.tsx          # crea el router con hash history
        routeTree.gen.ts  # generado por el plugin de TanStack Router
        routes/
          __root.tsx    # ruta raíz; si no hay ruta, el login
          index.tsx     # /, login Auth0 del alumno
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
        api/
          attendanceRules.ts # regla de puntual o tarde y llegada del propio alumno
          client.ts        # ApiClient: una función por endpoint y elección del transporte
          contract.ts      # tipos del contrato API v1
          fixtures.ts      # datos y casos del mock (--api-fixture)
          httpTransport.ts # transporte HTTP a través de main (--api-transport=http)
          isoTime.ts       # fechas ISO 8601 de los datos de ejemplo
          mockTransport.ts # mock en memoria con las reglas del contrato
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
          CorrectionReasonDialog.tsx # diálogo provisional de una corrección, con motivo opcional
          DateFilter.tsx
          JustificationAccess.tsx
          MobileAttendance.tsx
          PanelScreen.tsx
          RecognitionAward.tsx
          RecognitionIcon.tsx
          SettingsView.tsx
          StatsView.tsx
          StudentHistory.tsx
          apiValues.ts     # valores del contrato a los de la pantalla
          avatar.tsx
          classCode.ts       # código y enlace del QR de cada periodo de 30 s
          markControl.tsx
          markCorrection.tsx # diálogo de un cambio con la lista cerrada, con motivo opcional
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
    teacher-corrections.spec.ts # cambios con la lista cerrada, con y sin motivo, registro y volver
    panel.spec.ts
    panel-api.spec.ts   # pestaña Hoy con el cliente mock: reglas y fixtures
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
