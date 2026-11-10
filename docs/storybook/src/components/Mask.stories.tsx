import type { Meta, StoryObj } from '@storybook/react-vite'
import { Frame, Section } from '../gallery'
import placeholder from '../assets/placeholder.svg'
const meta = {
  title: 'Layout/Mask'
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

export const Gallery: Story = {
  render: () => (
    <Frame>
      <Section title="Forma">
        <img className="mask mask-squircle w-24" src={placeholder} alt="squircle" />
        <img className="mask mask-heart w-24" src={placeholder} alt="heart" />
        <img className="mask mask-hexagon w-24" src={placeholder} alt="hexagon" />
        <img className="mask mask-circle w-24" src={placeholder} alt="circle" />
        <img className="mask mask-triangle w-24" src={placeholder} alt="triangle" />
        <img className="mask mask-star w-24" src={placeholder} alt="star" />
        <img className="mask mask-diamond w-24" src={placeholder} alt="diamond" />
      </Section>
    </Frame>
  )
}
