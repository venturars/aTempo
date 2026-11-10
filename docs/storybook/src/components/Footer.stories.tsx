import type { Meta, StoryObj } from '@storybook/react-vite'
import { Frame, Section } from '../gallery'
const meta = {
  title: 'Layout/Footer'
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

export const Gallery: Story = {
  render: () => (
    <Frame>
      <Section title="Pie">
        <footer className="footer footer-horizontal bg-base-100 text-base-content w-full rounded-box p-6">
          <nav>
            <h3 className="footer-title">Guía</h3>
            <a>Piezas</a>
            <a>Reglas</a>
          </nav>
          <nav>
            <h3 className="footer-title">Cuenta</h3>
            <a>Entrar</a>
          </nav>
        </footer>
        <footer className="footer footer-center bg-base-100 w-full rounded-box p-4">
          <p>Texto centrado</p>
        </footer>
      </Section>
    </Frame>
  )
}
