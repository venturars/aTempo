import type { Meta, StoryObj } from '@storybook/react-vite'
import { Frame, Section } from '../gallery'
const meta = {
  title: 'Navegación/Pagination'
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

export const Gallery: Story = {
  render: () => (
    <Frame>
      <Section title="Páginas">
        <div className="join">
          <button className="join-item btn" type="button">«</button>
          <button className="join-item btn" type="button">1</button>
          <button className="join-item btn btn-active" type="button">2</button>
          <button className="join-item btn" type="button">3</button>
          <button className="join-item btn" type="button">»</button>
        </div>
      </Section>
    </Frame>
  )
}
