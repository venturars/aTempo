import type { Meta, StoryObj } from '@storybook/react-vite'
import { Frame, Section } from '../gallery'
const meta = {
  title: 'Navegación/Dock'
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

export const Gallery: Story = {
  render: () => (
    <Frame>
      <Section title="Barra">
        <div className="dock dock-md static">
          <button type="button"><span className="dock-label">Inicio</span></button>
          <button className="dock-active" type="button"><span className="dock-label">Guía</span></button>
          <button type="button"><span className="dock-label">Ajustes</span></button>
        </div>
      </Section>
    </Frame>
  )
}
