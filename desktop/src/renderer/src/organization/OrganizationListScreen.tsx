import { useEffect, useState } from 'react'
import {
  loadOrganizations,
  organizationCell,
  organizationColumns,
  type OrganizationRow
} from './organizationList'

const columnLabels: Record<string, string> = {
  id: 'Identificador',
  name: 'Nombre',
  tax_id: 'Identificación fiscal'
}

type ListState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; rows: OrganizationRow[] }

export function OrganizationListScreen(): React.JSX.Element {
  const [state, setState] = useState<ListState>({ status: 'loading' })

  useEffect(() => {
    const controller = new AbortController()

    loadOrganizations(controller.signal)
      .then((rows) => {
        if (!controller.signal.aborted) setState({ status: 'ready', rows })
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return
        const message = error instanceof Error ? error.message : 'No se ha podido leer la lista.'
        setState({ status: 'error', message })
      })

    return () => controller.abort()
  }, [])

  return (
    <main className="mx-auto flex min-h-screen max-w-[1440px] flex-col gap-6 p-5 md:p-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-2xl font-semibold">Organizaciones</h1>
        <p className="badge badge-ghost h-auto py-2 text-meta">Prueba · API local</p>
      </div>
      <OrganizationListBody state={state} />
    </main>
  )
}

function OrganizationListBody({ state }: { state: ListState }): React.JSX.Element {
  if (state.status === 'loading') {
    return <p className="text-sm text-base-content/70">Cargando organizaciones.</p>
  }

  if (state.status === 'error') {
    return (
      <div role="alert" className="alert alert-soft alert-error">
        <span>{state.message}</span>
      </div>
    )
  }

  const columns =
    state.rows.length === 0 ? ['id', 'name', 'tax_id'] : organizationColumns(state.rows)

  return (
    <section aria-labelledby="organization-list" className="card min-w-0 bg-base-100">
      <div className="card-body gap-4 p-6">
        <h2 id="organization-list" className="text-base font-medium">
          {state.rows.length === 1 ? '1 organización' : `${state.rows.length} organizaciones`}
        </h2>
        {state.rows.length === 0 ? (
          <p className="text-sm text-base-content/70">No hay organizaciones.</p>
        ) : null}
        <div className="min-w-0 overflow-x-auto">
          <table className="table w-full">
            <caption className="sr-only">Organizaciones devueltas por la API</caption>
            <thead>
              <tr>
                {columns.map((column) => (
                  <th key={column} scope="col">
                    <span className="block">{columnLabels[column] ?? column}</span>
                    <span className="mt-1 block text-meta font-normal normal-case text-base-content/60">
                      {column}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {state.rows.map((row, index) => (
                <tr key={rowKey(row, index)}>
                  {columns.map((column) => (
                    <td key={column} className="align-top">
                      {organizationCell(row[column])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}

function rowKey(row: OrganizationRow, index: number): string {
  const id = row.id
  return typeof id === 'string' && id !== '' ? id : `row-${index}`
}
