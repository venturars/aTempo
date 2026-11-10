import type { Meta, StoryObj } from '@storybook/react-vite'
import { Frame, Section } from '../gallery'
const meta = {
  title: 'Entrada/Rating'
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

export const Gallery: Story = {
  render: () => (
    <Frame>
      <Section title="Valor">
        <div className="rating">
          <input className="rating-hidden" type="radio" name="valor-1" aria-label="Vacío" />
          <input className="mask mask-star" type="radio" name="valor-1" aria-label="1" />
          <input className="mask mask-star" type="radio" name="valor-1" aria-label="2" defaultChecked />
          <input className="mask mask-star" type="radio" name="valor-1" aria-label="3" />
        </div>
        <div className="rating rating-lg">
          <div className="mask mask-star" aria-label="1"></div>
          <div className="mask mask-star" aria-label="2" aria-current="true"></div>
          <div className="mask mask-star" aria-label="3"></div>
        </div>
        <div className="rating rating-half rating-sm">
          <input className="mask mask-star-2" type="radio" name="valor-2" aria-label="Media" />
          <input className="mask mask-star-2" type="radio" name="valor-2" aria-label="Una" defaultChecked />
        </div>
      </Section>
    </Frame>
  )
}
