import type { Meta, StoryObj } from '@storybook/react-vite'
import { Frame, Section } from '../gallery'
const meta = {
  title: 'Aviso/Toast'
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

export const Gallery: Story = {
  render: () => (
    <Frame>
      <Section title="Aviso flotante">
        <div className="toast toast-end toast-bottom static">
          <div role="alert" className="alert alert-soft"><span>El cambio ya está guardado.</span></div>
        </div>
      </Section>
    </Frame>
  )
}
