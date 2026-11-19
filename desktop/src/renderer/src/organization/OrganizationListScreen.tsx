import { organizationListExample, type Organization } from './organizationListExample'

type OrganizationListScreenProps = { organizations?: Organization[] }

export function OrganizationListScreen({
  organizations = organizationListExample
}: OrganizationListScreenProps): React.JSX.Element {
  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-6 p-5 md:p-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-2xl font-semibold">Organizaciones</h1>
        <p className="badge badge-ghost h-auto py-2 text-meta">Prototipo · Datos ficticios</p>
      </div>
      {organizations.length === 0 ? (
        <p className="text-base-content/70">No hay organizaciones.</p>
      ) : (
        <OrganizationTable organizations={organizations} />
      )}
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
