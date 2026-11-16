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
          index.tsx     # /, login
          sign-up.tsx   # /sign-up, registro
          student/
            dashboard.tsx  # /student/dashboard
          organization/
            dashboard.tsx  # /organization/dashboard, Resumen de la organización
          teacher/
            panel.tsx      # /teacher/panel, PanelScreen
        env.d.ts
        styles/
          app.css       # importa docs/storybook/src/system.css
          fonts/        # Geist e Inter, woff2 con licencia OFL
        login/
          LoginScreen.tsx
          loginStore.ts
          validateLogin.ts
          trimesterExample.ts
        panel/
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
          markControl.tsx
          marks.ts
          panelStore.ts
          riskHint.tsx
          roster.ts
          sessionQr.tsx
          settingsStore.ts
        organization/
          OrganizationDashboardScreen.tsx
          organizationExample.ts
        register/
          RegisterScreen.tsx
          registerStore.ts
          validateRegister.ts
          weekExample.ts
        student/
          dashboard/
            DashboardScreen.tsx
        session/
          sessionStore.ts  # perfil de la sesión y ruta de su dashboard
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
    panel.spec.ts
    teacher-qr.spec.ts  # temporizador, llegadas y dos temas a 390/1280 px
    organization-dashboard.spec.ts
    register.spec.ts
    dashboard.spec.ts
    navigation.spec.ts  # rutas, flags de arranque y dashboard de cada perfil
    visual-system.spec.ts  # paridad de Storybook y escritorio, temas y rutas
    snapshots/
      login-empty.png
      login-errors.png
      login-alert.png
      login-narrow.png
      login-claro.png
      register-empty.png
      register-errors.png
      register-alert.png
      register-narrow.png
      register-claro.png
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
  build/                # iconos de empaquetado de la plantilla
  resources/            # icono de la ventana en Linux
```
