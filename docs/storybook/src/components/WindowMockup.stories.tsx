import type { Meta, StoryObj } from '@storybook/react-vite'
import { Frame, Section } from '../gallery'
const meta = {
  title: 'Maquetas/Window'
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

export const Gallery: Story = {
  render: () => (
    <Frame>
      <Section title="Ventana">
        <div className="mockup-window border border-base-300 w-full">
          <div className="bg-base-100 p-4">Contenido de la ventana.</div>
        </div>
      </Section>
    </Frame>
  )
}
