import type { Preview } from '@storybook/react-vite'
import { withThemeByDataAttribute } from '@storybook/addon-themes'

import '../src/theme.css'

const preview: Preview = {
  decorators: [
    withThemeByDataAttribute({
      themes: {
        'atempo-oscuro': 'atempo-oscuro',
        'atempo-claro': 'atempo-claro'
      },
      defaultTheme: 'atempo-oscuro',
      attributeName: 'data-theme'
    })
  ]
}

export default preview
