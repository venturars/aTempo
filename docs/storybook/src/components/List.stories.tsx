import type { Meta, StoryObj } from '@storybook/react-vite'
import { Frame, Section } from '../gallery'
const meta = {
  title: 'Datos/List'
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

export const Gallery: Story = {
  render: () => (
    <Frame>
      <Section title="Filas">
        <ul className="list bg-base-100 rounded-box w-full max-w-md">
          <li className="list-row">
            <div className="list-col-grow">Uno</div>
            <div>12</div>
          </li>
          <li className="list-row">
            <div className="list-col-grow">Dos</div>
            <div>08</div>
          </li>
        </ul>
      </Section>
    </Frame>
  )
}
