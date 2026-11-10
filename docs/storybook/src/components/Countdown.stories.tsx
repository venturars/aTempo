import type { Meta, StoryObj } from '@storybook/react-vite'
import { Frame, Section } from '../gallery'
const meta = {
  title: 'Datos/Countdown'
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

export const Gallery: Story = {
  render: () => (
    <Frame>
      <Section title="Número">
        <span className="countdown font-mono text-2xl">
          <span style={{ ['--value' as string]: 12 }} aria-label="12">12</span>
        </span>
      </Section>
    </Frame>
  )
}
