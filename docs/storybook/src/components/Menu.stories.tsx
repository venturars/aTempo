import type { Meta, StoryObj } from '@storybook/react-vite'
import { Frame, Section } from '../gallery'
const meta = {
  title: 'Navegación/Menu'
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

export const Gallery: Story = {
  render: () => (
    <Frame>
      <Section title="Vertical">
        <ul className="menu bg-base-100 rounded-box w-56">
          <li className="menu-title">Grupo</li>
          <li><a>Uno</a></li>
          <li><a className="menu-active">Dos</a></li>
          <li><a className="menu-disabled">Tres</a></li>
        </ul>
      </Section>
      <Section title="Horizontal y tamaño">
        <ul className="menu menu-horizontal bg-base-100 rounded-box">
          <li><a>Uno</a></li>
          <li><a>Dos</a></li>
        </ul>
        <ul className="menu menu-xs bg-base-100 rounded-box w-40">
          <li><a>Pequeño</a></li>
        </ul>
        <ul className="menu menu-lg bg-base-100 rounded-box w-56">
          <li><a>Grande</a></li>
        </ul>
      </Section>
    </Frame>
  )
}
