type UnderConstructionScreenProps = {
  title: string
}

export function UnderConstructionScreen({
  title
}: UnderConstructionScreenProps): React.JSX.Element {
  return (
    <main className="flex min-h-screen items-center justify-center p-8">
      <section className="w-full max-w-3xl rounded-box bg-base-100 p-8 text-center">
        <h1 className="text-2xl font-medium text-base-content">{title}</h1>
        <p className="mt-2 text-base-content">En construcción</p>
      </section>
    </main>
  )
}
