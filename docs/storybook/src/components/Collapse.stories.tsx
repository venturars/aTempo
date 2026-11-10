import type { Meta, StoryObj } from '@storybook/react-vite'
import { Frame, Section } from '../gallery'
const meta = {
  title: 'Datos/Collapse'
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

export const Gallery: Story = {
  render: () => (
    <Frame>
      <Section title="Casilla">
        <div className="collapse collapse-arrow bg-base-100 w-full max-w-md">
          <input type="checkbox" aria-label="Detalle" />
          <div className="collapse-title font-medium">Detalle</div>
          <div className="collapse-content">El texto aparece al marcar la casilla.</div>
        </div>
      </Section>
    </Frame>
  )
}
