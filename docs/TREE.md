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
      index.ts          # puente oficial; login y Dashboard no lo usan
      index.d.ts
    renderer/
      index.html
      src/
        main.tsx
        App.tsx         # login o Dashboard tras envío válido
        env.d.ts
        styles/
          app.css       # Tailwind y daisyUI
          fonts/        # Geist e Inter, woff2 con licencia OFL
        login/
          LoginScreen.tsx
          loginStore.ts
          validateLogin.ts
          trimesterExample.ts
        organization/
          OrganizationDashboardScreen.tsx # Dashboard visual sin funciones de administración
          organizationExample.ts          # modelos y datos ficticios normal, vacío e incompleto
  tests/
    login.spec.ts
    organization-dashboard.spec.ts
    fixtures/           # montaje de estados solo para pruebas
      dashboard.html
      dashboard.tsx
      build-dashboard.mjs
    snapshots/
      login-empty.png
      login-errors.png
      login-alert.png
      login-narrow.png
      login-claro.png
      dashboard-empty.png
      dashboard-incomplete.png
      dashboard-atempo-oscuro-1280.png
      dashboard-atempo-oscuro-390.png
      dashboard-atempo-claro-1280.png
      dashboard-atempo-claro-390.png
  build/                # iconos de empaquetado de la plantilla
  resources/            # icono de la ventana en Linux
```
