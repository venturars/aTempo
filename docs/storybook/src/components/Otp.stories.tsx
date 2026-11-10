import type { Meta, StoryObj } from '@storybook/react-vite'
import { Frame, Section } from '../gallery'
const meta = {
  title: 'Entrada/OTP'
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

export const Gallery: Story = {
  render: () => (
    <Frame>
      <Section title="Código">
        <label className="otp">
          <span></span><span></span><span></span><span></span>
          <input type="text" autoComplete="one-time-code" inputMode="numeric" maxLength={4} aria-label="Código" />
        </label>
        <label className="otp otp-joined otp-primary">
          <span></span><span></span><span></span><span></span>
          <input type="text" inputMode="numeric" maxLength={4} aria-label="Código unido" />
        </label>
        <label className="otp otp-lg">
          <span></span><span></span><span></span><span></span>
          <input type="text" inputMode="numeric" maxLength={4} aria-label="Código grande" />
        </label>
      </Section>
    </Frame>
  )
}
