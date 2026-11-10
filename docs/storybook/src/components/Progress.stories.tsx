import type { Meta, StoryObj } from '@storybook/react-vite'
import { Frame, Section } from '../gallery'
const meta = {
  title: 'Aviso/Progress'
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

export const Gallery: Story = {
  render: () => (
    <Frame>
      <Section title="Barra">
        <progress className="progress w-56" value="40" max="100">40 %</progress>
        <progress className="progress progress-primary w-56" value="70" max="100">70 %</progress>
        <progress className="progress progress-success w-56" value="90" max="100">90 %</progress>
        <progress className="progress progress-error progress-lg w-56" value="20" max="100">20 %</progress>
      </Section>
    </Frame>
  )
}
