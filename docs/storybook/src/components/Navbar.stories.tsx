import type { Meta, StoryObj } from '@storybook/react-vite'
import { Frame, Section } from '../gallery'
const meta = {
  title: 'Navegación/Navbar'
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

export const Gallery: Story = {
  render: () => (
    <Frame>
      <Section title="Barra">
        <div className="navbar bg-base-100 w-full rounded-box">
          <div className="navbar-start">Inicio</div>
          <div className="navbar-center">Guía</div>
          <div className="navbar-end">
            <button className="btn btn-primary" type="button">Guardar</button>
          </div>
        </div>
      </Section>
    </Frame>
  )
}
