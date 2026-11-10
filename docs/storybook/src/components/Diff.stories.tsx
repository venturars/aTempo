import type { Meta, StoryObj } from '@storybook/react-vite'
import { Frame, Section } from '../gallery'
import placeholder from '../assets/placeholder.svg'
const meta = {
  title: 'Datos/Diff'
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

export const Gallery: Story = {
  render: () => (
    <Frame>
      <Section title="Comparación">
        <figure className="diff aspect-video max-w-md">
          <div className="diff-item-1"><img src={placeholder} alt="Antes" /></div>
          <div className="diff-item-2"><img src={placeholder} alt="Después" /></div>
          <div className="diff-resizer"></div>
        </figure>
      </Section>
    </Frame>
  )
}
