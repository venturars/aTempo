import type { Meta, StoryObj } from '@storybook/react-vite'
import { Frame, Section } from '../gallery'
const meta = {
  title: 'Aviso/Radial progress'
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

export const Gallery: Story = {
  render: () => (
    <Frame>
      <Section title="Anillo">
        <div className="radial-progress" style={{ ['--value' as string]: 70 }} role="progressbar" aria-valuenow={70}>70 %</div>
        <div className="radial-progress text-primary" style={{ ['--value' as string]: 40, ['--size' as string]: '4rem' }} role="progressbar" aria-valuenow={40}>40 %</div>
      </Section>
    </Frame>
  )
}
