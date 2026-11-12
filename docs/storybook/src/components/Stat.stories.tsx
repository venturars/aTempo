import type { Meta, StoryObj } from '@storybook/react-vite'
import { Frame, Section } from '../gallery'
const meta = {
  title: 'Datos/Stat'
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

export const Gallery: Story = {
  render: () => (
    <Frame>
      <Section title="Cifras">
        <div className="stats bg-base-100">
          <div className="stat">
            <div className="stat-title">Total</div>
            <div className="stat-value">85 %</div>
            <div className="stat-desc">Este mes</div>
          </div>
          <div className="stat">
            <div className="stat-figure text-primary">+</div>
            <div className="stat-title">Nuevos</div>
            <div className="stat-value text-primary">12</div>
            <div className="stat-desc">Desde ayer</div>
          </div>
        </div>
        <div className="stats stats-vertical bg-base-100">
          <div className="stat">
            <div className="stat-title">Vertical</div>
            <div className="stat-value">3</div>
          </div>
        </div>
      </Section>
    </Frame>
  )
}
