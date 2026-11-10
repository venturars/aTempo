import type { Meta, StoryObj } from '@storybook/react-vite'
import { Frame, Section } from '../gallery'
const meta = {
  title: 'Entrada/Range'
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

export const Gallery: Story = {
  render: () => (
    <Frame>
      <Section title="Rango">
        <input className="range" type="range" min="0" max="100" defaultValue="40" aria-label="Neutro" />
        <input className="range range-primary" type="range" min="0" max="100" defaultValue="60" aria-label="Primario" />
        <input className="range range-success range-xs" type="range" min="0" max="100" defaultValue="80" aria-label="Pequeño" />
        <input className="range range-lg" type="range" min="0" max="100" defaultValue="20" aria-label="Grande" />
      </Section>
    </Frame>
  )
}
