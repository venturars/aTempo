import type { Meta, StoryObj } from '@storybook/react-vite'
import { Frame, Section } from '../gallery'
const meta = {
  title: 'Entrada/Validator'
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

export const Gallery: Story = {
  render: () => (
    <Frame>
      <Section title="Validación">
        <div>
          <input className="input validator" type="email" required placeholder="Correo" aria-label="Correo" />
          <p className="validator-hint">El correo no tiene una forma válida.</p>
        </div>
      </Section>
    </Frame>
  )
}
