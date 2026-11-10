import type { Meta, StoryObj } from '@storybook/react-vite'
import { Frame, Section } from '../gallery'
const meta = {
  title: 'Acciones/Swap'
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

export const Gallery: Story = {
  render: () => (
    <Frame>
      <Section title="Cambio">
        <label className="swap">
          <input type="checkbox" aria-label="Cambiar" />
          <span className="swap-off">Apagado</span>
          <span className="swap-on">Encendido</span>
        </label>
        <label className="swap swap-rotate">
          <input type="checkbox" aria-label="Girar" />
          <span className="swap-off">Apagado</span>
          <span className="swap-on">Encendido</span>
        </label>
        <label className="swap swap-flip">
          <input type="checkbox" aria-label="Voltear" />
          <span className="swap-off">Apagado</span>
          <span className="swap-on">Encendido</span>
        </label>
        <label className="swap swap-active">
          <input type="checkbox" aria-label="Activo" defaultChecked />
          <span className="swap-off">Apagado</span>
          <span className="swap-on">Encendido</span>
        </label>
      </Section>
    </Frame>
  )
}
