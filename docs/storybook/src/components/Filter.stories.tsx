import type { Meta, StoryObj } from '@storybook/react-vite'
import { Frame, Section } from '../gallery'
const meta = {
  title: 'Entrada/Filter'
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

export const Gallery: Story = {
  render: () => (
    <Frame>
      <Section title="Opciones">
        <div className="filter">
          <input className="btn filter-reset" type="radio" name="filtro-guia" aria-label="×" />
          <input className="btn" type="radio" name="filtro-guia" aria-label="Uno" />
          <input className="btn" type="radio" name="filtro-guia" aria-label="Dos" />
          <input className="btn" type="radio" name="filtro-guia" aria-label="Tres" />
        </div>
      </Section>
    </Frame>
  )
}
