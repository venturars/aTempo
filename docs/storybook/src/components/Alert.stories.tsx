import type { Meta, StoryObj } from '@storybook/react-vite'
import { Frame, Section } from '../gallery'
const meta = {
  title: 'Aviso/Alert'
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

export const Gallery: Story = {
  render: () => (
    <Frame>
      <Section title="Color">
        <div role="alert" className="alert"><span>Neutro</span></div>
        <div role="alert" className="alert alert-info"><span>Aviso</span></div>
        <div role="alert" className="alert alert-success"><span>Listo</span></div>
        <div role="alert" className="alert alert-warning"><span>Revisar</span></div>
        <div role="alert" className="alert alert-error"><span>Borrar</span></div>
      </Section>
      <Section title="Estilo">
        <div role="alert" className="alert alert-outline alert-info"><span>Contorno</span></div>
        <div role="alert" className="alert alert-dash alert-warning"><span>Trazo</span></div>
        <div role="alert" className="alert alert-soft alert-success"><span>Suave</span></div>
        <div role="alert" className="alert alert-vertical"><span>Vertical</span></div>
      </Section>
    </Frame>
  )
}
