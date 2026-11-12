import type { Meta, StoryObj } from '@storybook/react-vite'
import { Frame, Section } from '../gallery'
const meta = {
  title: 'Texto/Text rotate'
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

export const Gallery: Story = {
  render: () => (
    <Frame>
      <Section title="Palabras">
        <span className="text-rotate text-2xl">
          <span>
            <span>Guardar</span>
            <span>Cerrar</span>
            <span>Seguir</span>
          </span>
        </span>
      </Section>
    </Frame>
  )
}
