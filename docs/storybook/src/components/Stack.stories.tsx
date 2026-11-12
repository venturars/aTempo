import type { Meta, StoryObj } from '@storybook/react-vite'
import { Frame, Section } from '../gallery'
const meta = {
  title: 'Layout/Stack'
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

export const Gallery: Story = {
  render: () => (
    <Frame>
      <Section title="Pila">
        <div className="stack">
          <div className="grid h-24 w-32 place-items-center rounded-box bg-primary text-primary-content">Uno</div>
          <div className="grid h-24 w-32 place-items-center rounded-box bg-secondary text-secondary-content">Dos</div>
          <div className="grid h-24 w-32 place-items-center rounded-box bg-base-300">Tres</div>
        </div>
      </Section>
    </Frame>
  )
}
