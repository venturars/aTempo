import type { Meta, StoryObj } from '@storybook/react-vite'
import { Frame, Section } from '../gallery'
const meta = {
  title: 'Entrada/File input'
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

export const Gallery: Story = {
  render: () => (
    <Frame>
      <Section title="Color">
        <input className="file-input" type="file" aria-label="Neutro" />
        <input className="file-input file-input-primary" type="file" aria-label="Guardar" />
        <input className="file-input file-input-secondary" type="file" aria-label="Seguir" />
        <input className="file-input file-input-accent" type="file" aria-label="Marcar" />
        <input className="file-input file-input-info" type="file" aria-label="Aviso" />
        <input className="file-input file-input-success" type="file" aria-label="Listo" />
        <input className="file-input file-input-warning" type="file" aria-label="Revisar" />
        <input className="file-input file-input-error" type="file" aria-label="Borrar" />
      </Section>
      <Section title="Tamaño">
        <input className="file-input file-input-xs" type="file" aria-label="xs" />
        <input className="file-input file-input-sm" type="file" aria-label="sm" />
        <input className="file-input" type="file" aria-label="md" />
        <input className="file-input file-input-lg" type="file" aria-label="lg" />
        <input className="file-input file-input-xl" type="file" aria-label="xl" />
      </Section>
    </Frame>
  )
}
