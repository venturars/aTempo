const themeKey = 'atempo-theme'
const themes = ['atempo-oscuro', 'atempo-claro']

export function applySavedTheme(): void {
  try {
    const saved = localStorage.getItem(themeKey)
    if (saved !== null && themes.includes(saved)) {
      document.documentElement.setAttribute('data-theme', saved)
    }
  } catch {
    // Sin almacenamiento se queda el tema de index.html.
  }
}

export function saveTheme(theme: string): void {
  try {
    localStorage.setItem(themeKey, theme)
  } catch {
    // El tema se aplica igual; solo no se recuerda en el próximo arranque.
  }
}
