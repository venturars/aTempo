import type { Meta, StoryObj } from '@storybook/react-vite'
import { Frame, Section } from '../gallery'
const meta = {
  title: 'Datos/Indicator'
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

export const Gallery: Story = {
  render: () => (
    <Frame>
      <Section title="Esquina">
        <div className="indicator">
          <span className="indicator-item badge">8</span>
          <div className="bg-base-100 grid h-24 w-24 place-items-center rounded-box">Caja</div>
        </div>
        <div className="indicator">
          <span className="indicator-item indicator-start badge">Inicio</span>
          <div className="bg-base-100 grid h-24 w-32 place-items-center rounded-box">Caja</div>
        </div>
        <div className="indicator">
          <span className="indicator-item indicator-bottom indicator-center badge">Abajo</span>
          <div className="bg-base-100 grid h-24 w-32 place-items-center rounded-box">Caja</div>
        </div>
      </Section>
    </Frame>
  )
}
