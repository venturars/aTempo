export type AppScreen = 'sign in' | 'sign up'

export function screenFromSearch(search: string): AppScreen {
  const screen = new URLSearchParams(search).get('screen')

  if (screen === 'sign up') {
    return 'sign up'
  }

  return 'sign in'
}
