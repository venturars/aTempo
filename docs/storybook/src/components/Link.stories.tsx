import type { Meta, StoryObj } from '@storybook/react-vite'
import { Frame, Section } from '../gallery'
const meta = {
  title: 'Navegación/Link'
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

export const Gallery: Story = {
  render: () => (
    <Frame>
      <Section title="Color">
        <a className="link" href="#ejemplo">Neutro</a>
        <a className="link link-primary" href="#ejemplo">Guardar</a>
        <a className="link link-secondary" href="#ejemplo">Seguir</a>
        <a className="link link-accent" href="#ejemplo">Marcar</a>
        <a className="link link-info" href="#ejemplo">Aviso</a>
        <a className="link link-success" href="#ejemplo">Listo</a>
        <a className="link link-warning" href="#ejemplo">Revisar</a>
        <a className="link link-error" href="#ejemplo">Borrar</a>
      </Section>
      <Section title="Hover">
        <a className="link link-hover" href="#ejemplo">Al pasar</a>
      </Section>
    </Frame>
  )
}
