import type { Meta, StoryObj } from '@storybook/react-vite'
import { Frame, Section } from '../gallery'
const meta = {
  title: 'Aviso/Loading'
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

export const Gallery: Story = {
  render: () => (
    <Frame>
      <Section title="Forma">
        <span className="inline-flex items-center gap-2">Cargando <span className="loading loading-spinner"></span></span>
        <span className="loading loading-dots"></span>
        <span className="loading loading-ring"></span>
        <span className="loading loading-ball"></span>
        <span className="loading loading-bars"></span>
        <span className="loading loading-infinity"></span>
      </Section>
      <Section title="Tamaño y color">
        <span className="loading loading-spinner loading-xs"></span>
        <span className="loading loading-spinner loading-lg"></span>
        <span className="loading loading-spinner loading-primary"></span>
        <span className="loading loading-spinner loading-error"></span>
      </Section>
    </Frame>
  )
}
