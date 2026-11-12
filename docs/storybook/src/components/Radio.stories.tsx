import type { Meta, StoryObj } from '@storybook/react-vite'
import { Frame, Section } from '../gallery'
const meta = {
  title: 'Entrada/Radio'
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

export const Gallery: Story = {
  render: () => (
    <Frame>
      <Section title="Color">
        <input className="radio" type="radio" aria-label="Neutro" />
        <input className="radio radio-primary" type="radio" aria-label="Guardar" defaultChecked />
        <input className="radio radio-secondary" type="radio" aria-label="Seguir" />
        <input className="radio radio-accent" type="radio" aria-label="Marcar" />
        <input className="radio radio-info" type="radio" aria-label="Aviso" />
        <input className="radio radio-success" type="radio" aria-label="Listo" />
        <input className="radio radio-warning" type="radio" aria-label="Revisar" />
        <input className="radio radio-error" type="radio" aria-label="Borrar" />
      </Section>
      <Section title="Tamaño">
        <input className="radio radio-xs" type="radio" aria-label="xs" defaultChecked />
        <input className="radio radio-sm" type="radio" aria-label="sm" defaultChecked />
        <input className="radio" type="radio" aria-label="md" defaultChecked />
        <input className="radio radio-lg" type="radio" aria-label="lg" defaultChecked />
        <input className="radio radio-xl" type="radio" aria-label="xl" defaultChecked />
      </Section>
    </Frame>
  )
}
