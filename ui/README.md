# atempo-ui

Componentes de interfaz compartidos de aTempo. Los usan `desktop/` y Storybook; `web/` puede instalarlo igual.

El paquete publica su código TypeScript (`src/index.ts`) sin compilar. `react` es `peerDependency`: la app pone su React y lo compila con su Vite y su `tsc`.

## Usarlo en una app

1. Añade la dependencia: `"atempo-ui": "file:../ui"` (desde `docs/storybook/`, `file:../../ui`) y ejecuta `pnpm install`.
2. Añade `@source` de `ui/src` al CSS de entrada de la app, para que Tailwind genere las clases del paquete.
3. Impórtalo:

```tsx
import { Pagination, usePagination } from 'atempo-ui'

function SessionList({ sessions }: { sessions: Session[] }) {
  const sessionsPage = usePagination(sessions, 20)
  return (
    <>
      <SessionTable rows={sessionsPage.items} />
      <Pagination
        page={sessionsPage.page}
        pageCount={sessionsPage.pageCount}
        onPageChange={sessionsPage.setPage}
        size="sm"
      />
    </>
  )
}
```

pnpm copia el paquete al instalar: tras cambiar `ui/`, vuelve a ejecutar `pnpm install` en la app.

## Componentes

- `Pagination`: `page` (empieza en 1), `pageCount` y `onPageChange`. Opcionales: `siblings` (vecinas de la página actual, 1 por defecto), `size` (`xs`, `sm` o `md`), `labels` (textos del `nav`, anterior, siguiente y cada página) y `className`. Con una página o ninguna no pinta nada.
- `usePagination(items, pageSize)`: devuelve `page`, `pageCount`, `items` de la página, `from`, `to`, `total` y `setPage`.
- `pageItems(page, pageCount, siblings)`: los botones de página, con `'gap'` en los huecos.

## Comprobaciones

```sh
docker compose run --rm ui pnpm typecheck
docker compose run --rm ui pnpm lint
docker compose run --rm ui pnpm test
```
