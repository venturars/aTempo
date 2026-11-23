const healthRequestTimeoutMs = 10_000

type FetchLike = typeof fetch

let fetchOverride: FetchLike | undefined

export function substituteFetch(implementation: FetchLike | undefined): void {
  fetchOverride = implementation
}

export async function send(
  input: string,
  init?: RequestInit,
): Promise<Response> {
  const run = fetchOverride ?? fetch
  return run(input, {
    ...init,
    signal: init?.signal ?? AbortSignal.timeout(healthRequestTimeoutMs),
  })
}
