import type { Meta, StoryObj } from '@storybook/react-vite'
import { Frame, Section } from '../gallery'
const meta = {
  title: 'Acciones/Dropdown'
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

export const Gallery: Story = {
  render: () => (
    <Frame>
      <Section title="Abierto">
        <div className="dropdown dropdown-open">
          <button className="btn" type="button">Abrir</button>
          <ul className="dropdown-content menu bg-base-100 rounded-box z-10 w-52 p-2">
            <li><a>Uno</a></li>
            <li><a>Dos</a></li>
          </ul>
        </div>
      </Section>
      <Section title="Posición">
        <div className="dropdown dropdown-end dropdown-open">
          <button className="btn" type="button">Final</button>
          <ul className="dropdown-content menu bg-base-100 rounded-box z-10 w-52 p-2">
            <li><a>Uno</a></li>
          </ul>
        </div>
        <div className="dropdown dropdown-top dropdown-open">
          <button className="btn" type="button">Arriba</button>
          <ul className="dropdown-content menu bg-base-100 rounded-box z-10 w-52 p-2">
            <li><a>Uno</a></li>
          </ul>
        </div>
        <div className="dropdown dropdown-hover">
          <button className="btn" type="button">Al pasar</button>
          <ul className="dropdown-content menu bg-base-100 rounded-box z-10 w-52 p-2">
            <li><a>Uno</a></li>
          </ul>
        </div>
      </Section>
    </Frame>
  )
}
