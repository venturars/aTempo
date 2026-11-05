# Sugerencias para aTempo

Documento vivo para recopilar **propuestas de tecnologías**, **ideas de producto** y **flujos** antes de fijar decisiones definitivas. Se irá ampliando según surjan nuevas aportaciones.

---

## Índice

- [Frontend](#frontend)
- [Backend](#backend)
- [Datos](#datos)
- [Autenticación (nota)](#autenticación-nota)
- [Pendiente de definir](#pendiente-de-definir)

---

## Frontend

### Next.js

| Aspecto | Notas |
| -------- | ----- |
| **Por qué** | Varios roles (admin, profesor, alumno) con pantallas distintas; el routing encaja bien con App Router y layouts por segmento. |
| **Ventajas** | Buen punto de partida (boilerplate), ecosistema amplio, muy adoptado en la industria. |
| **Stack habitual** | TypeScript, Tailwind CSS. |

### shadcn/ui

| Aspecto | Notas |
| -------- | ----- |
| **Por qué** | Evitar construir cada componente UI desde cero. |
| **Ventajas** | Componentes accesibles, personalizables y reutilizables; cubre la mayoría de patrones (formularios, tablas, diálogos, etc.). |
| **Relación con Next.js** | Integración natural con React + Tailwind en proyectos Next. |

---

## Backend

### Python

| Aspecto | Notas |
| -------- | ----- |
| **Decisión** | La lógica de negocio, la API y la integración con la base de datos vivirán en **Python** (no en el runtime de Next.js). |
| **Arquitectura** | **Next.js** como cliente (web admin, portal alumno); **API Python** como capa intermedia; **PostgreSQL** como persistencia. |
| **Framework (por concretar)** | Opciones habituales: **FastAPI** (API REST/async, OpenAPI), **Django + DRF** (batteries included, admin). Aún no cerrado. |
| **ORM / acceso a datos** | SQLAlchemy, Django ORM, o similar; conexión a Postgres local o a Neon vía connection string. |

El frontend no debería hablar directamente con la base de datos en producción: las reglas de asistencia, roles y auditoría se validan en el backend.

---

## Datos

### PostgreSQL

| Aspecto | Notas |
| -------- | ----- |
| **Por qué** | Base de datos relacional sólida, muy usada y con buena demanda profesional. |
| **Consideración** | En desarrollo local, cada alumno debería instalar y ejecutar Postgres en su máquina (o usar contenedor). |

### Neon (Postgres en la nube)

| Aspecto | Notas |
| -------- | ----- |
| **Por qué** | Mantener una instancia compartida y sincronizada para trabajo en equipo remoto. |
| **Ventajas** | Fácil de usar; plan gratuito con margen razonable; no se pausa por inactividad (a diferencia de la experiencia habitual con Supabase en free tier). |
| **Uso típico** | Entorno compartido de desarrollo/staging; local con Postgres sigue siendo opción para cada desarrollador. |
| **Con Python** | Neon encaja bien como Postgres gestionado; la API Python se conecta con el driver/ORM habitual (misma idea que con Postgres local). |

---

## Autenticación (nota)

Con **backend Python**, el modelo no tiene por qué ser el de Supabase (cliente → Auth + Data API + RLS desde el navegador). Lo habitual:

| Enfoque | Idea |
| -------- | ----- |
| **Auth en la API Python** | Login/registro en FastAPI/Django; sesiones o **JWT**; el frontend envía el token en cada petición; permisos por rol en el servidor. |
| **Proveedor externo** | Clerk, Auth0, Keycloak, etc.: el frontend obtiene el token; Python valida el JWT y aplica autorización. |
| **Neon Auth** | Posible si queréis usuarios en Postgres con servicio gestionado por Neon; la **validación** sigue haciéndose en Python (o en un BFF), no sustituye por sí sola la API. |
| **Supabase solo por Auth** | Se puede usar Supabase Auth y que Python verifique el JWT de Supabase, pero mezcla dos proveedores si la BD es Neon — suele preferirse un solo camino. |

**Neon ≠ Supabase en auth:** Neon es sobre todo Postgres; la auth “tipo Supabase” (todo integrado en el cliente) encaja menos con un **API Python** clásica que auth centralizada en el backend.

---

## Pendiente de definir

- **Backend Python:** framework (FastAPI vs Django u otro), estructura del proyecto, despliegue.
- **Autenticación y autorización** por rol (admin org, profesor, alumno, admin aTempo).
- **App de escritorio del profesor:** tecnología (¿Electron, Tauri, PWA, otro?).
- **Flujos:** registro de asistencia, justificantes, notificaciones, integraciones.
- **Más ideas:** ampliar esta sección conforme se vayan añadiendo propuestas.

---

## Historial de cambios (opcional)

| Fecha | Cambio |
| ----- | ------ |
| 2026-11-05 | Versión inicial: Next.js, shadcn/ui, PostgreSQL, Neon. |
| 2026-11-05 | Backend en Python; notas de arquitectura y autenticación. |
