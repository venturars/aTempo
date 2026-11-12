import type { Meta, StoryObj } from '@storybook/react-vite'
import { Frame, Section } from '../gallery'
const meta = {
  title: 'Datos/Badge'
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

export const Gallery: Story = {
  render: () => (
    <Frame>
      <Section title="Color">
        <span className="badge">Neutro</span>
        <span className="badge badge-primary">Guardar</span>
        <span className="badge badge-secondary">Seguir</span>
        <span className="badge badge-accent">Marcar</span>
        <span className="badge badge-info">Aviso</span>
        <span className="badge badge-success">Listo</span>
        <span className="badge badge-warning">Revisar</span>
        <span className="badge badge-error">Borrar</span>
      </Section>
      <Section title="Estilo">
        <span className="badge badge-outline">Contorno</span>
        <span className="badge badge-soft badge-primary">Suave</span>
        <span className="badge badge-dash">Trazo</span>
        <span className="badge badge-ghost">Ghost</span>
      </Section>
      <Section title="Tamaño">
        <span className="badge badge-xs">xs</span>
        <span className="badge badge-sm">sm</span>
        <span className="badge">md</span>
        <span className="badge badge-lg">lg</span>
        <span className="badge badge-xl">xl</span>
      </Section>
    </Frame>
  )
}
