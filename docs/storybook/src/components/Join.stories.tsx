import type { Meta, StoryObj } from '@storybook/react-vite'
import { Frame, Section } from '../gallery'
const meta = {
  title: 'Layout/Join'
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

export const Gallery: Story = {
  render: () => (
    <Frame>
      <Section title="Grupo">
        <div className="join">
          <button className="btn join-item" type="button">Uno</button>
          <button className="btn join-item" type="button">Dos</button>
          <button className="btn join-item" type="button">Tres</button>
        </div>
        <div className="join join-vertical">
          <button className="btn join-item" type="button">Arriba</button>
          <button className="btn join-item" type="button">Abajo</button>
        </div>
      </Section>
    </Frame>
  )
}
