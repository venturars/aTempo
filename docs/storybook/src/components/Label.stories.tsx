import type { Meta, StoryObj } from '@storybook/react-vite'
import { Frame, Section } from '../gallery'
const meta = {
  title: 'Entrada/Label'
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

export const Gallery: Story = {
  render: () => (
    <Frame>
      <Section title="Etiqueta">
        <label className="input w-full max-w-sm">
          <span className="label">Correo</span>
          <input type="email" aria-label="Correo" />
        </label>
        <label className="floating-label w-full max-w-sm">
          <input className="input" type="text" placeholder="Nombre" />
          <span>Nombre</span>
        </label>
      </Section>
    </Frame>
  )
}
