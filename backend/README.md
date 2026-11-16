# Backend de aTempo

API de aTempo construida con NestJS, Node.js, TypeScript y pnpm. Este servicio es independiente de la aplicación Electron.

## Requisitos

- Node.js 24.14 o posterior en la línea 24.
- Corepack habilitado y pnpm 10.33.0 (el proyecto lo fija en `package.json`).

## Instalación

Desde la carpeta `backend/`:

```powershell
corepack pnpm install
Copy-Item .env.example .env
corepack pnpm start:dev
```

La API arranca en `http://localhost:3000`. Comprueba `http://localhost:3000/api/health`; debe responder `{"status":"ok"}`. El puerto se configura con `PORT` en `.env`.

Para compilar y ejecutar pruebas:

```powershell
corepack pnpm build
corepack pnpm test
corepack pnpm test:e2e
```

Los módulos `auth`, `users`, `organizations`, `courses`, `sessions` y `attendance` reservan la estructura inicial. Auth0 y la base de datos se integrarán cuando se definan en sus tareas.
