# api-router

Servicio REST con NestJS y TypeScript. Recibe las peticiones de los frontends (Electron y web) y las adapta. Auth0 (`register`, `login`, `refresh`, `logout`, `me`) permanece en `AuthService`. Tras login, register o `me` correctos, el router llama a `afterAuth({ email })` de [`sdk/`](../sdk/) (`atempo-sdk`, `file:../sdk`). El router no implementa reglas de negocio; traduce HTTP y delega en la SDK.

Admin HTTP (mock en memoria, `Authorization: Bearer` no vacío): módulos Nest `organization/`, `person/` y `course/` (controller → service → `atempo-sdk`). `POST /organizations`; `GET` y `PATCH /organizations/:organizationId`; `POST` y `GET /organizations/:organizationId/people`; `GET`, `PATCH` y `DELETE /people/:personId`; `POST /organizations/:organizationId/courses`; `POST` y `GET /organizations/:organizationId/courses/:courseId/people`; `DELETE .../people/:personId` (204). Mismo cuerpo de error que el contrato v1.

Expone `GET /health`, `POST /auth/register`, `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout` y `GET /auth/me`. Electron y web usan los mismos paths. Electron intercambia tokens en JSON; la web, con origen `ATEMPO_WEB_ORIGIN`, guarda access y refresh en cookies HttpOnly. `GET /auth/me` con Bearer sigue `{ "email" }`; con cookie, `{ "email", "profile" }`. `afterAuth` usa el claim `email`; si no hay persona, el resultado es ok y no crea. `CONFIGURATION` o `PERSISTENCE` → 503 `POSTGRES_API_UNAVAILABLE`. `VALIDATION` → 400, no 503. Logout, refresh y Auth0 ko no llaman a la SDK.

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

Configura `AUTH0_DOMAIN`, `AUTH0_CLIENT_ID`, `AUTH0_CLIENT_SECRET` y `AUTH0_AUDIENCE` en el `.env` local de la raíz antes de iniciar Compose. `AUTH0_DOMAIN` es el dominio HTTPS del tenant y `AUTH0_AUDIENCE` es el API Identifier configurado en Auth0. Compose solo pasa estas variables al servicio `api-router`; el secreto no entra en los frontends ni se versiona. La aplicación Auth0 debe tener Password Grant y acceso a la conexión de usuarios. La web admite las cuentas existentes `profesor@atempo.test` y `ada.lopez@clase.test`, y asigna a cada una el perfil demo acordado.

`POST /auth/login` recibe `{ "email": "...", "password": "..." }`. Sin origen web responde `{ "accessToken": "...", "expiresIn": 3600, "refreshToken": "..." }` cuando Auth0 incluye duración y refresh. Con origen `ATEMPO_WEB_ORIGIN` (por defecto `http://localhost:5191`) responde `{ "email", "profile" }`, fija cookies HttpOnly `atempo_access`, `atempo_refresh` y `atempo_identity` (`SameSite=Lax`, `Path=/`, `Secure` en HTTPS, sin `Max-Age`) y no incluye tokens en el JSON. Solo admite `profesor@atempo.test` y `ada.lopez@clase.test`. Credenciales rechazadas o un origen distinto del configurado cuando se envía `Origin` devuelven `401` o `403`. `POST /auth/register` recibe el mismo cuerpo y responde `201` con `{ "userId", "token", "refreshToken" }`; un correo duplicado es `409` `USER_EXISTS`. `POST /auth/refresh` con `{ "refreshToken" }` responde `{ "token", "refreshToken" }`; con origen web lee la cookie, llama a Auth0 y reescribe las cookies sin devolver tokens. `POST /auth/logout` con cuerpo revoca el refresh; con origen web revoca el de la cookie y la borra. `GET /auth/me` con `Authorization: Bearer` devuelve `{ "email" }`; con cookie de access valida el JWT y responde `{ "email", "profile" }`. Auth0 debe incluir `email` en el access token; si no, `/auth/me` responde `401` `INVALID_TOKEN`. `/health` y `/docs` son públicos. Las funciones de cookie están en `src/shared/cookies.ts`.

Durante el desarrollo, Vite envía `/api/*` al router y quita el prefijo `/api`. El destino por defecto es `http://localhost:3000`; se configura con `ATEMPO_API_ROUTER_PORT`. El comando `pnpm run atempo --router-only` inicia el router en el proyecto Compose `atempo` con el `.env` de Auth0.

## Docker Compose

Tras `docker compose run --rm setup`, el servicio forma parte del entorno Compose: desde la raíz, `docker compose up api-router` lo sirve en <http://localhost:3000>. El proyecto Compose `atempo` monta `./api-router` y `./sdk` en ese servicio, instala `file:../sdk` y pasa `API_POSTGRESQL_URL=http://api-postgresql:3001`. `pnpm run atempo --router-only` reutiliza ese mismo servicio y puerto; `--port` permite elegir otro puerto cuando haga falta. `docker compose up api-router api-postgresql api-sqlite api-rustfs` inicia las cuatro APIs actuales; PostgreSQL y RustFS arrancan como dependencias de sus servicios. La base y los datos de persistencia permanecen en volúmenes separados.

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
- `pnpm test` — pruebas e2e de `/health`, Swagger, auth, organizaciones, resumen y el mock del contrato (si `API_MOCK=true`).
- `pnpm build` — compilación a `dist/`.
