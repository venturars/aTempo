import type { Meta, StoryObj } from '@storybook/react-vite'
import { Frame, Section } from '../gallery'
const meta = {
  title: 'Navegación/Breadcrumbs'
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

export const Gallery: Story = {
  render: () => (
    <Frame>
      <Section title="Ruta">
        <div className="breadcrumbs">
          <ul>
            <li><a>Inicio</a></li>
            <li><a>Guía</a></li>
            <li>Pieza</li>
          </ul>
        </div>
      </Section>
    </Frame>
  )
}
