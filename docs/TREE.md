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
        register/
          RegisterScreen.tsx
          registerStore.ts
          validateRegister.ts
        components/
          ClaimPanel.tsx      # panel del claim; lo usan el login y el registro
          trimesterExample.ts
  tests/
    login.spec.ts
    register.spec.ts
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
  build/                # iconos de empaquetado de la plantilla
  resources/            # icono de la ventana en Linux
```
