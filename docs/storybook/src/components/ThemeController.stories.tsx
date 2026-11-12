import type { Meta, StoryObj } from '@storybook/react-vite'
import { Frame, Section } from '../gallery'
const meta = {
  title: 'Acciones/Theme controller'
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

export const Gallery: Story = {
  render: () => (
    <Frame>
      <Section title="Temas">
        <label className="flex items-center gap-2">
          <input className="theme-controller radio" type="radio" name="tema-guia" value="atempo-oscuro" aria-label="Oscuro" />
          Oscuro
        </label>
        <label className="flex items-center gap-2">
          <input className="theme-controller radio" type="radio" name="tema-guia" value="atempo-claro" aria-label="Claro" />
          Claro
        </label>
      </Section>
    </Frame>
  )
}
