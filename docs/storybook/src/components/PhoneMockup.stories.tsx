import type { Meta, StoryObj } from '@storybook/react-vite'
import { Frame, Section } from '../gallery'
const meta = {
  title: 'Maquetas/Phone'
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

export const Gallery: Story = {
  render: () => (
    <Frame>
      <Section title="Teléfono">
        <div className="mockup-phone">
          <div className="mockup-phone-camera"></div>
          <div className="mockup-phone-display bg-base-100 text-base-content grid place-items-center">Pantalla</div>
        </div>
      </Section>
    </Frame>
  )
}
