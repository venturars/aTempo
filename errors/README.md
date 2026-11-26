# errors

Paquete `@atempo/errors`. Clases de error y una fábrica que construye errores a partir de un catálogo. No conoce aTempo: no tiene labels, reasons ni mensajes propios. Cada paquete que lo usa trae su catálogo.

## Qué exporta

- `DomainError` y sus subclases `ValidationError`, `NotFoundError`, `ConflictError`, `ConfigurationError` y `PersistenceError`. Cada error lleva `kind` e `id`. Los que crea la fábrica llevan también `entity` y, solo si la label tiene punto, `field`.
- Los tipos `DomainErrorKind` (`VALIDATION`, `NOT_FOUND`, `CONFLICT`, `CONFIGURATION`, `PERSISTENCE`) y `DomainErrorOptions`.
- `labelParts(label)`, que parte `person.email` en `{ entity: 'person', field: 'email' }`. Una label sin punto, como `person`, da `{ entity: 'person' }`: `entity` es la label entera y no hay `field`.
- `createErrorFactory(catalog)`, que recibe `labels`, `reasons` y, opcionalmente, `messages`, y devuelve `{ domainError, fail }`. `domainError(label, reason)` devuelve el error con `id` `label.reason`; `fail(label, reason)` lo lanza. El mensaje sale de `messages[id]` si existe y, si no, de `reasons[reason].message(label)`. Una label o una reason que no está en el catálogo no compila.
- Los tipos `ErrorCatalog`, `ErrorReason` y `ErrorFactory`.

```ts
import { createErrorFactory } from '@atempo/errors'

const { fail } = createErrorFactory({
  labels: ['thing.code'] as const,
  reasons: {
    taken: {
      kind: 'CONFLICT',
      message: (label: string) => `${label} ya existe`,
    },
  },
})

fail('thing.code', 'taken') // lanza ConflictError con id thing.code.taken
```

## Cómo se instala

No se publica en npm. `domain/node/` lo enlaza con `"@atempo/errors": "link:../../errors"`, y su `pnpm install` instala y compila este paquete con el script `prepare`. Los consumidores leen `dist/`.

## Instalar y probar

Desde `errors/`:

```sh
pnpm install
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```
