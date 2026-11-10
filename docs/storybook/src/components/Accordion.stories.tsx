import type { Meta, StoryObj } from '@storybook/react-vite'
import { Frame, Section } from '../gallery'
const meta = {
  title: 'Datos/Accordion'
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

export const Gallery: Story = {
  render: () => (
    <Frame>
      <Section title="Flecha">
        <div className="w-full max-w-md">
          <div className="collapse collapse-arrow bg-base-100">
            <input type="radio" name="acordeon-flecha" defaultChecked aria-label="Uno" />
            <div className="collapse-title font-medium">Uno</div>
            <div className="collapse-content">El primer texto.</div>
          </div>
          <div className="collapse collapse-arrow bg-base-100">
            <input type="radio" name="acordeon-flecha" aria-label="Dos" />
            <div className="collapse-title font-medium">Dos</div>
            <div className="collapse-content">El segundo texto.</div>
          </div>
        </div>
      </Section>
      <Section title="Más">
        <div className="collapse collapse-plus bg-base-100 w-full max-w-md">
          <input type="checkbox" aria-label="Tres" />
          <div className="collapse-title font-medium">Tres</div>
          <div className="collapse-content">Se abre con una casilla.</div>
        </div>
        <div className="collapse collapse-open bg-base-100 w-full max-w-md">
          <div className="collapse-title font-medium">Abierto</div>
          <div className="collapse-content">Este bloque permanece abierto.</div>
        </div>
        <div className="collapse collapse-close bg-base-100 w-full max-w-md">
          <div className="collapse-title font-medium">Cerrado</div>
          <div className="collapse-content">Este bloque permanece cerrado.</div>
        </div>
      </Section>
    </Frame>
  )
}
