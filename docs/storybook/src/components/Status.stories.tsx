import type { Meta, StoryObj } from '@storybook/react-vite'
import { Frame, Section } from '../gallery'
const meta = {
  title: 'Datos/Status'
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

export const Gallery: Story = {
  render: () => (
    <Frame>
      <Section title="Color">
        <span className="inline-flex items-center gap-2"><span className="status"></span>Neutro</span>
        <span className="inline-flex items-center gap-2"><span className="status status-primary"></span>Guardar</span>
        <span className="inline-flex items-center gap-2"><span className="status status-secondary"></span>Seguir</span>
        <span className="inline-flex items-center gap-2"><span className="status status-accent"></span>Marcar</span>
        <span className="inline-flex items-center gap-2"><span className="status status-info"></span>Aviso</span>
        <span className="inline-flex items-center gap-2"><span className="status status-success"></span>Listo</span>
        <span className="inline-flex items-center gap-2"><span className="status status-warning"></span>Revisar</span>
        <span className="inline-flex items-center gap-2"><span className="status status-error"></span>Borrar</span>
      </Section>
      <Section title="Tamaño">
        <span className="inline-flex items-center gap-2"><span className="status status-xs"></span>xs</span>
        <span className="inline-flex items-center gap-2"><span className="status status-sm"></span>sm</span>
        <span className="inline-flex items-center gap-2"><span className="status"></span>md</span>
        <span className="inline-flex items-center gap-2"><span className="status status-lg"></span>lg</span>
        <span className="inline-flex items-center gap-2"><span className="status status-xl"></span>xl</span>
      </Section>
    </Frame>
  )
}
