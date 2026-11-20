import { getRouteApi, type ErrorComponentProps } from '@tanstack/react-router'
import { organizationListUrl, type Organization } from './organizationApi'

// getRouteApi lee los datos del loader sin importar el objeto Route (evita dependencias circulares).
const routeApi = getRouteApi('/organization/list')

export function OrganizationListScreen(): React.JSX.Element {
  const organizations = routeApi.useLoaderData()

  return (
    <OrganizationListLayout>
      {organizations.length === 0 ? (
        <p className="text-base-content/70">No hay organizaciones.</p>
      ) : (
        <OrganizationTable organizations={organizations} />
      )}
    </OrganizationListLayout>
  )
}

export function OrganizationListLoading(): React.JSX.Element {
  return (
    <OrganizationListLayout>
      <span className="inline-flex items-center gap-2">
        Cargando
        <span className="loading loading-spinner"></span>
      </span>
    </OrganizationListLayout>
  )
}

export function OrganizationListError({ error }: ErrorComponentProps): React.JSX.Element {
  // En React, error llega como unknown: hay que comprobar que es un Error antes de leer message.
  const reason = error instanceof Error ? error.message : 'Error desconocido.'

  return (
    <OrganizationListLayout>
      <div role="alert" className="alert alert-error alert-soft">
        <span>
          No se pudo leer {organizationListUrl}. Levanta api-postgresql y vuelve a abrir la
          pantalla. ({reason})
        </span>
      </div>
    </OrganizationListLayout>
  )
}

function OrganizationListLayout({ children }: { children: React.ReactNode }): React.JSX.Element {
  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-6 p-5 md:p-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-2xl font-semibold">Organizaciones</h1>
        <p className="badge badge-ghost h-auto py-2 text-meta">Prueba · API local</p>
      </div>
      {children}
    </main>
  )
}

function OrganizationTable({
  organizations
}: {
  organizations: Organization[]
}): React.JSX.Element {
  return (
    <div className="w-full overflow-x-auto rounded-box bg-base-100">
      <table className="table table-zebra">
        <thead>
          <tr>
            <th scope="col">Nombre</th>
            <th scope="col">CIF</th>
            <th scope="col">ID</th>
          </tr>
        </thead>
        <tbody>
          {organizations.map((organization) => (
            <tr key={organization.id}>
              <td className="font-medium">{organization.name}</td>
              <td className="tabular-nums">{organization.tax_id}</td>
              <td className="font-mono text-sm text-base-content/70">{organization.id}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
