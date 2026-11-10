import type { Meta, StoryObj } from '@storybook/react-vite'
import { Frame, Section } from '../gallery'
const meta = {
  title: 'Datos/Timeline'
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

export const Gallery: Story = {
  render: () => (
    <Frame>
      <Section title="Hechos">
        <ul className="timeline">
          <li>
            <div className="timeline-start">09:00</div>
            <div className="timeline-middle">1</div>
            <div className="timeline-end timeline-box">Empieza</div>
          </li>
          <li>
            <hr />
            <div className="timeline-start">10:00</div>
            <div className="timeline-middle">2</div>
            <div className="timeline-end timeline-box">Sigue</div>
          </li>
        </ul>
        <ul className="timeline timeline-vertical">
          <li>
            <div className="timeline-start">Ayer</div>
            <div className="timeline-middle">1</div>
            <div className="timeline-end">Nota</div>
          </li>
        </ul>
        <ul className="timeline timeline-compact timeline-snap-icon">
          <li>
            <div className="timeline-middle">1</div>
            <div className="timeline-end">Compacto</div>
          </li>
        </ul>
      </Section>
    </Frame>
  )
}
