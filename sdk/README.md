# atempo-sdk

Lógica de negocio de aTempo (capas shared, dominio, aplicación, infraestructura mock y composición). No es un servicio HTTP: lo consume `api-router/` mediante `file:../sdk`.

El dominio sigue `postgres/init/01_schema.sql`: `PersonRecord` (tabla `person`, con `organization_id` e `invitation_status`), roles en `person_role` (repositorio mock en mapa aparte) y `OrganizationPerson` como agregado expuesto por los casos de uso. Tipos de dominio en `src/domain/`: `Uuid`, `DateOnly` (`scalars.ts`); `Email` (`email.ts`); `TaxId`, `IdentificationDocument` (`identifier.ts`); `NonEmptyText`, `Phone` (`text.ts`). Los casos de uso parsean en el borde; las entidades no usan `string` genérico salvo en el DTO de presentación `organization-dashboard.ts`.

## Comprobaciones locales

Desde `sdk/`:

```sh
pnpm install
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

## Docker Compose

Desde la raíz del repositorio, tras `docker compose run --rm setup`:

```sh
docker compose run --rm sdk pnpm test
```

Sustituye `test` por `typecheck`, `lint` o `build`. El servicio `sdk` monta el repositorio en `/work` y el volumen `sdk-node-modules` en `sdk/node_modules`. Si instalaste dependencias en el host, borra `sdk/node_modules/` local antes del primer `setup` en Docker para que el volumen no herede permisos de Windows.