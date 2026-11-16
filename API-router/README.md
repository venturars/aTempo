# API-router

Servicio REST con NestJS y TypeScript. Recibe las peticiones de los frontends (Electron y web), las adapta y las delegará en la **SDK (lógica de negocio)**. El router no implementa reglas de negocio.

Hoy solo expone `GET /health`. La lógica de negocio vivirá en [`sdk/`](../sdk/) (paquete hermano, carpeta pendiente); este servicio la consumirá cuando exista.

## Arranque

```sh
pnpm install
pnpm dev
```

Por defecto escucha en el puerto `3000`. Puedes usar la variable `PORT`.

Otros comandos:

- `pnpm typecheck` — comprobación de tipos.
- `pnpm test` — prueba e2e de `/health`.
- `pnpm build` — compilación a `dist/`.