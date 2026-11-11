export type AppScreen = 'login' | 'register'

export function screenFromSearch(search: string): AppScreen {
  const screen = new URLSearchParams(search).get('screen')

  if (screen === 'register') {
    return 'register'
  }

  return 'login'
}
