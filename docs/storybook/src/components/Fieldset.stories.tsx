import type { Meta, StoryObj } from '@storybook/react-vite'
import { Frame, Section } from '../gallery'
const meta = {
  title: 'Entrada/Fieldset'
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

export const Gallery: Story = {
  render: () => (
    <Frame>
      <Section title="Grupo">
        <fieldset className="fieldset bg-base-100 rounded-box w-full max-w-sm p-4">
          <legend className="fieldset-legend">Correo</legend>
          <input className="input w-full" type="email" aria-label="Correo" />
          <p className="label">Usamos el correo para avisarte.</p>
        </fieldset>
      </Section>
    </Frame>
  )
}
