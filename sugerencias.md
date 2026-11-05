# Sugerencias para aTempo

Documento vivo para recopilar **propuestas de tecnologías**, **ideas de producto** y **flujos** antes de fijar decisiones definitivas. Se irá ampliando según surjan nuevas aportaciones.

---

## Índice

- [Frontend](#frontend)
- [Backend y datos](#backend-y-datos)
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

## Backend y datos

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

---

## Pendiente de definir

- **Backend:** servicios, API, autenticación, autorización por rol.
- **App de escritorio del profesor:** tecnología (¿Electron, Tauri, PWA, otro?).
- **Flujos:** registro de asistencia, justificantes, notificaciones, integraciones.
- **Más ideas:** ampliar esta sección conforme se vayan añadiendo propuestas.

---

## Historial de cambios (opcional)

| Fecha | Cambio |
| ----- | ------ |
| 2026-11-05 | Versión inicial: Next.js, shadcn/ui, PostgreSQL, Neon. |
