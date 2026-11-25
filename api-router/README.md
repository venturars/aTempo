# api-router

Servicio REST con NestJS y TypeScript. Recibe las peticiones de los frontends (Electron y web), las adapta y las delegará en la **SDK (lógica de negocio)**. El router no implementa reglas de negocio.

Expone `GET /health`, `POST /auth/register`, `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout` y `GET /auth/me`. El login y el alta solicitan tokens a Auth0; `/auth/refresh` los renueva y `/auth/logout` revoca el refresh token. `/auth/me` valida el Bearer recibido. La lógica de negocio vivirá en [`sdk/`](../sdk/) (paquete hermano, carpeta pendiente); este servicio la consumirá cuando exista.

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

Está en `src/mock-api/` y aplica las mismas reglas que el mock del escritorio: abrir solo una sesión programada y del día, cerrar pasa los pendientes a ausentes, cada corrección exige motivo. Hay una clase de AI Engineering cada día (09:00–18:00, `+01:00`, margen de 10 minutos) con 15 alumnos. El estado se pierde al reiniciar el servicio. Cada endpoint pide `Authorization: Bearer` con un token no vacío y responde `401 UNAUTHENTICATED` sin él; no lo valida contra Auth0. No implementa `POST /check-ins`.

Los errores siguen la sección «Errores» del contrato: `statusCode`, `error`, `code`, `message` y, en validación, `details`. Lo hacen `src/contract/` y el `exceptionFactory` del `ValidationPipe`, que valen también para los endpoints reales.

Compose arranca el router con `API_MOCK=true` y solo lo publica en `127.0.0.1`. Sin la variable, solo sirve `/health` y `/auth`. El mock desaparece cuando la SDK sirva estos endpoints.

## Arranque

Desde `api-router/`:

```sh
pnpm install
pnpm dev
```

Por defecto escucha en el puerto `3000`. Puedes usar la variable `PORT`.

## Auth0

Configura `AUTH0_DOMAIN`, `AUTH0_CLIENT_ID`, `AUTH0_CLIENT_SECRET` y `AUTH0_AUDIENCE` en el `.env` local de la raíz antes de iniciar Compose. `AUTH0_DOMAIN` es el dominio HTTPS del tenant y `AUTH0_AUDIENCE` es el API Identifier configurado en Auth0. Compose solo pasa estas variables al servicio `api-router`; el secreto no entra en Electron ni se versiona. La Application debe tener Password Grant y acceso a la conexión de usuarios. Las cuentas de prueba ya están creadas; comprueba que la conexión permite su login.

`POST /auth/login` recibe `{ "email": "...", "password": "..." }` y responde `{ "accessToken": "...", "expiresIn": 3600, "refreshToken": "..." }` cuando Auth0 incluye duración y refresh. Credenciales rechazadas devuelven `401` con código `INVALID_CREDENTIALS`. `POST /auth/register` recibe el mismo cuerpo y responde `201` con `{ "userId", "token", "refreshToken" }`; un correo duplicado es `409` `USER_EXISTS`. `POST /auth/refresh` recibe `{ "refreshToken" }` y responde `{ "token", "refreshToken" }`. `POST /auth/logout` recibe `{ "refreshToken" }` y responde `{ "success": true }`. `GET /auth/me` requiere `Authorization: Bearer <accessToken>` y devuelve `{ "email": "..." }` (trim y minúsculas) si el token incluye un claim `email` no vacío además de `sub`. Auth0 debe incluir `email` en el access token (API Identifier / Action); si no, `/auth/me` responde `401` `INVALID_TOKEN`. `/health` y `/docs` son públicos.

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
