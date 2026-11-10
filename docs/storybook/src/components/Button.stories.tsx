import type { Meta, StoryObj } from '@storybook/react-vite'
import { Frame, Section } from '../gallery'
const meta = {
  title: 'Acciones/Button'
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

export const Gallery: Story = {
  render: () => (
    <Frame>
      <Section title="Color">
        <button className="btn" type="button">Neutro</button>
        <button className="btn btn-primary" type="button">Guardar</button>
        <button className="btn btn-secondary" type="button">Seguir</button>
        <button className="btn btn-accent" type="button">Marcar</button>
        <button className="btn btn-info" type="button">Aviso</button>
        <button className="btn btn-success" type="button">Listo</button>
        <button className="btn btn-warning" type="button">Revisar</button>
        <button className="btn btn-error" type="button">Borrar</button>
      </Section>
      <Section title="Estilo">
        <button className="btn btn-outline" type="button">Contorno</button>
        <button className="btn btn-dash" type="button">Trazo</button>
        <button className="btn btn-soft btn-primary" type="button">Suave</button>
        <button className="btn btn-ghost" type="button">Ghost</button>
        <button className="btn btn-link" type="button">Enlace</button>
      </Section>
      <Section title="Tamaño">
        <button className="btn btn-xs" type="button">xs</button>
        <button className="btn btn-sm" type="button">sm</button>
        <button className="btn" type="button">md</button>
        <button className="btn btn-lg" type="button">lg</button>
        <button className="btn btn-xl" type="button">xl</button>
      </Section>
      <Section title="Estado">
        <button className="btn btn-active" type="button">Activo</button>
        <button className="btn" type="button" disabled>Desactivado</button>
      </Section>
      <Section title="Forma">
        <button className="btn btn-wide" type="button">Ancho</button>
        <button className="btn btn-block" type="button">Bloque</button>
        <button className="btn btn-square" type="button">Ok</button>
        <button className="btn btn-circle" type="button">Ok</button>
      </Section>
    </Frame>
  )
}
