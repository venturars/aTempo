import type { Meta, StoryObj } from '@storybook/react-vite'
import { Frame, Section } from '../gallery'
const meta = {
  title: 'Datos/Kbd'
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

export const Gallery: Story = {
  render: () => (
    <Frame>
      <Section title="Tamaño">
        <kbd className="kbd kbd-xs">xs</kbd>
        <kbd className="kbd kbd-sm">sm</kbd>
        <kbd className="kbd">md</kbd>
        <kbd className="kbd kbd-lg">lg</kbd>
        <kbd className="kbd kbd-xl">xl</kbd>
      </Section>
    </Frame>
  )
}
