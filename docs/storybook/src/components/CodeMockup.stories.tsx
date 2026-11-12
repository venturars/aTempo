import type { Meta, StoryObj } from '@storybook/react-vite'
import { Frame, Section } from '../gallery'
const meta = {
  title: 'Maquetas/Code'
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

export const Gallery: Story = {
  render: () => (
    <Frame>
      <Section title="Código">
        <div className="mockup-code w-full">
          <pre data-prefix="$"><code>pnpm storybook</code></pre>
          <pre data-prefix=">" className="text-warning"><code>Abre la guía</code></pre>
        </div>
      </Section>
    </Frame>
  )
}
