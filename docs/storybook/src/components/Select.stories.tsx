import type { Meta, StoryObj } from '@storybook/react-vite'
import { Frame, Section } from '../gallery'
const meta = {
  title: 'Entrada/Select'
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

export const Gallery: Story = {
  render: () => (
    <Frame>
      <Section title="Lista">
        <select className="select" aria-label="Elegir" defaultValue="">
          <option value="" disabled>Elige</option>
          <option>Uno</option>
          <option>Dos</option>
        </select>
        <select className="select select-primary" aria-label="Primario" defaultValue="Uno">
          <option>Uno</option>
        </select>
        <select className="select select-ghost select-sm" aria-label="Ghost" defaultValue="Uno">
          <option>Uno</option>
        </select>
      </Section>
    </Frame>
  )
}
