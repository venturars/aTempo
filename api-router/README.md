# api-router

Servicio REST con NestJS y TypeScript. Recibe las peticiones de los frontends (Electron y web), las adapta y las delegará en la **SDK (lógica de negocio)**. El router no implementa reglas de negocio.

Expone `GET /health`. La lógica de negocio vivirá en [`sdk/`](../sdk/) (paquete hermano, carpeta pendiente); este servicio la consumirá cuando exista.

## Mock del contrato API v1

Con `API_MOCK=true`, el router sirve con datos en memoria los ocho endpoints del [contrato API v1](https://github.com/venturars/aTempo/issues/90#issuecomment-6977966757) que usa la pestaña Hoy del panel del profesor:

- `GET /sessions?date=YYYY-MM-DD`
- `GET /sessions/:sessionId`
- `GET /sessions/:sessionId/attendances`
- `POST /sessions/:sessionId/open`
- `POST /sessions/:sessionId/close`
- `GET /sessions/:sessionId/check-in-code`
- `PUT /sessions/:sessionId/attendances/:studentId`
- `GET /courses/:courseId/students`

Está en `src/mock-api/` y aplica las mismas reglas que el mock del escritorio: abrir solo una sesión programada y del día, cerrar pasa los pendientes a ausentes, cada corrección exige motivo. Hay una clase de AI Engineering cada día (09:00–18:00, `+01:00`, margen de 10 minutos) con 15 alumnos. El estado se pierde al reiniciar el servicio. No pide token y no implementa `POST /check-ins` ni la autenticación.

Los errores siguen la sección «Errores» del contrato: `statusCode`, `error`, `code`, `message` y, en validación, `details`. Lo hacen `src/contract/` y el `exceptionFactory` del `ValidationPipe`, que valen también para los endpoints reales.

Compose arranca el router con `API_MOCK=true`. Sin la variable, solo sirve `/health`. El mock desaparece cuando la SDK sirva estos endpoints.

## Arranque

Desde `api-router/`:

```sh
pnpm install
pnpm dev
```

Por defecto escucha en el puerto `3000`. Puedes usar la variable `PORT`.

## Docker Compose

Tras `docker compose run --rm setup`, el servicio ya forma parte del entorno Compose: desde la raíz, `docker compose up api-router` lo sirve en <http://localhost:3000>. `docker compose up api-router api-postgresql api-sqlite api-rustfs` inicia las cuatro APIs actuales; PostgreSQL y RustFS arrancan como dependencias de sus servicios. La base y los datos de persistencia permanecen en volúmenes separados.

Las pruebas y comprobaciones se ejecutan con el volumen Linux del paquete: `docker compose run --rm api-router pnpm test` (sustituye `test` por `typecheck`, `lint` o `build`).

## Probar con Swagger

1. Con el servicio en marcha (`pnpm dev`), abre `http://localhost:3000/docs` (o el mismo puerto que uses con `PORT`).
2. En la sección **health**, abre `GET /health` → **Try it out** → **Execute**.
3. La respuesta debe ser `200` con cuerpo `{ "status": "ok" }`.

El documento OpenAPI en JSON está en `/docs-json`.

Otros comandos, desde `api-router/`:

```sh
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

- `pnpm typecheck` — comprobación de tipos.
- `pnpm lint` — ESLint sobre `src/` y `test/`.
- `pnpm test` — pruebas e2e de `/health`, Swagger y el mock del contrato.
- `pnpm build` — compilación a `dist/`.
