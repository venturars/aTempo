import type { Meta, StoryObj } from '@storybook/react-vite'
import { Frame, Section } from '../gallery'
import placeholder from '../assets/placeholder.svg'
const meta = {
  title: 'Datos/Hover gallery'
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

export const Gallery: Story = {
  render: () => (
    <Frame>
      <Section title="Imágenes">
        <figure className="hover-gallery max-w-60">
          <img src={placeholder} alt="Primera" />
          <img src={placeholder} alt="Segunda" />
          <img src={placeholder} alt="Tercera" />
        </figure>
      </Section>
    </Frame>
  )
}
