import type { Meta, StoryObj } from '@storybook/react-vite'
import { Frame, Section } from '../gallery'
const meta = {
  title: 'Entrada/Checkbox'
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

export const Gallery: Story = {
  render: () => (
    <Frame>
      <Section title="Color">
        <input className="checkbox" type="checkbox" aria-label="Neutro" />
        <input className="checkbox checkbox-primary" type="checkbox" aria-label="Guardar" defaultChecked />
        <input className="checkbox checkbox-secondary" type="checkbox" aria-label="Seguir" />
        <input className="checkbox checkbox-accent" type="checkbox" aria-label="Marcar" />
        <input className="checkbox checkbox-info" type="checkbox" aria-label="Aviso" />
        <input className="checkbox checkbox-success" type="checkbox" aria-label="Listo" />
        <input className="checkbox checkbox-warning" type="checkbox" aria-label="Revisar" />
        <input className="checkbox checkbox-error" type="checkbox" aria-label="Borrar" />
      </Section>
      <Section title="Tamaño">
        <input className="checkbox checkbox-xs" type="checkbox" aria-label="xs" defaultChecked />
        <input className="checkbox checkbox-sm" type="checkbox" aria-label="sm" defaultChecked />
        <input className="checkbox" type="checkbox" aria-label="md" defaultChecked />
        <input className="checkbox checkbox-lg" type="checkbox" aria-label="lg" defaultChecked />
        <input className="checkbox checkbox-xl" type="checkbox" aria-label="xl" defaultChecked />
      </Section>
      <Section title="Estado">
        <input className="checkbox" type="checkbox" aria-label="Marcada" defaultChecked />
        <input className="checkbox" type="checkbox" aria-label="Desactivada" disabled />
      </Section>
    </Frame>
  )
}
