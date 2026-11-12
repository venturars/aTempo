import type { Meta, StoryObj } from '@storybook/react-vite'
import { Frame, Section } from '../gallery'
const meta = {
  title: 'Entrada/Input'
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

export const Gallery: Story = {
  render: () => (
    <Frame>
      <Section title="Color">
        <input className="input" type="text" aria-label="Neutro" placeholder="Neutro" />
        <input className="input input-primary" type="text" aria-label="Guardar" placeholder="Guardar" />
        <input className="input input-secondary" type="text" aria-label="Seguir" placeholder="Seguir" />
        <input className="input input-accent" type="text" aria-label="Marcar" placeholder="Marcar" />
        <input className="input input-info" type="text" aria-label="Aviso" placeholder="Aviso" />
        <input className="input input-success" type="text" aria-label="Listo" placeholder="Listo" />
        <input className="input input-warning" type="text" aria-label="Revisar" placeholder="Revisar" />
        <input className="input input-error" type="text" aria-label="Borrar" placeholder="Borrar" />
      </Section>
      <Section title="Tamaño y estado">
        <input className="input input-sm" type="text" aria-label="Pequeño" placeholder="Pequeño" />
        <input className="input input-lg" type="text" aria-label="Grande" placeholder="Grande" />
        <input className="input input-ghost" type="text" aria-label="Ghost" placeholder="Ghost" />
        <input className="input input-error" type="text" aria-label="Correo" aria-invalid="true" defaultValue="ana" />
      </Section>
    </Frame>
  )
}
