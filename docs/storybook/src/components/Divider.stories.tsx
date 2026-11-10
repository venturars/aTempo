import type { Meta, StoryObj } from '@storybook/react-vite'
import { Frame, Section } from '../gallery'
const meta = {
  title: 'Layout/Divider'
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

export const Gallery: Story = {
  render: () => (
    <Frame>
      <Section title="Línea">
        <div className="flex w-full flex-col">
          <div className="divider">O</div>
          <div className="divider divider-primary">Primario</div>
        </div>
        <div className="flex h-24 w-full items-center">
          <span>Uno</span>
          <div className="divider divider-horizontal">O</div>
          <span>Dos</span>
        </div>
      </Section>
    </Frame>
  )
}
