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
      index.ts          # abre la ventana y la base
      database.ts       # abre atempo.sqlite con node:sqlite
    preload/
      index.ts          # puente oficial; el login no lo usa
      index.d.ts
    renderer/
      index.html
      src/
        main.tsx
        App.tsx
        env.d.ts
        styles/
          app.css       # Tailwind y daisyUI
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
  tests/
    login.spec.ts
    panel.spec.ts
    snapshots/
      login-empty.png
      login-errors.png
      login-alert.png
      login-narrow.png
      login-claro.png
  build/                # iconos de empaquetado de la plantilla
  resources/            # icono de la ventana en Linux
```
