import type { Meta, StoryObj } from '@storybook/react-vite'
import { Frame, Section } from '../gallery'
const meta = {
  title: 'Navegación/Steps'
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

export const Gallery: Story = {
  render: () => (
    <Frame>
      <Section title="Pasos">
        <ul className="steps">
          <li className="step step-primary">Datos</li>
          <li className="step step-primary">Revisión</li>
          <li className="step">Envío</li>
        </ul>
        <ul className="steps steps-vertical">
          <li className="step step-info" data-content="1">Uno</li>
          <li className="step" data-content="2">Dos</li>
        </ul>
      </Section>
    </Frame>
  )
}
