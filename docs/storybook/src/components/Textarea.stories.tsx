import type { Meta, StoryObj } from '@storybook/react-vite'
import { Frame, Section } from '../gallery'
const meta = {
  title: 'Entrada/Textarea'
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

export const Gallery: Story = {
  render: () => (
    <Frame>
      <Section title="Texto">
        <textarea className="textarea" aria-label="Nota" placeholder="Nota"></textarea>
        <textarea className="textarea textarea-primary" aria-label="Primario" placeholder="Primario"></textarea>
        <textarea className="textarea textarea-ghost textarea-sm" aria-label="Pequeño" placeholder="Pequeño"></textarea>
      </Section>
    </Frame>
  )
}
