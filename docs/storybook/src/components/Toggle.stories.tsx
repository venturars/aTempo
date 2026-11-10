import type { Meta, StoryObj } from '@storybook/react-vite'
import { Frame, Section } from '../gallery'
const meta = {
  title: 'Entrada/Toggle'
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

export const Gallery: Story = {
  render: () => (
    <Frame>
      <Section title="Color">
        <input className="toggle" type="checkbox" aria-label="Neutro" />
        <input className="toggle toggle-primary" type="checkbox" aria-label="Guardar" defaultChecked />
        <input className="toggle toggle-secondary" type="checkbox" aria-label="Seguir" />
        <input className="toggle toggle-accent" type="checkbox" aria-label="Marcar" />
        <input className="toggle toggle-info" type="checkbox" aria-label="Aviso" />
        <input className="toggle toggle-success" type="checkbox" aria-label="Listo" />
        <input className="toggle toggle-warning" type="checkbox" aria-label="Revisar" />
        <input className="toggle toggle-error" type="checkbox" aria-label="Borrar" />
      </Section>
      <Section title="Tamaño">
        <input className="toggle toggle-xs" type="checkbox" aria-label="xs" defaultChecked />
        <input className="toggle toggle-sm" type="checkbox" aria-label="sm" defaultChecked />
        <input className="toggle" type="checkbox" aria-label="md" defaultChecked />
        <input className="toggle toggle-lg" type="checkbox" aria-label="lg" defaultChecked />
        <input className="toggle toggle-xl" type="checkbox" aria-label="xl" defaultChecked />
      </Section>
    </Frame>
  )
}
