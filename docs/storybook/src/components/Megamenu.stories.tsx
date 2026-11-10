import type { Meta, StoryObj } from '@storybook/react-vite'
import { Frame, Section } from '../gallery'
const meta = {
  title: 'Navegación/Megamenu'
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

export const Gallery: Story = {
  render: () => (
    <Frame>
      <Section title="Menú">
        <div className="w-full">
          <div className="megamenu megamenu-wide w-full border border-base-300 bg-base-100 p-2">
            <span className="megamenu-active"></span>
            <button type="button" popoverTarget="mega-uno">Uno</button>
            <div id="mega-uno" popover="auto">
              <ul className="menu">
                <li><a>Primer enlace</a></li>
                <li><a>Segundo enlace</a></li>
              </ul>
            </div>
            <button type="button" popoverTarget="mega-dos">Dos</button>
            <div id="mega-dos" popover="auto">
              <ul className="menu">
                <li><a>Otro enlace</a></li>
              </ul>
            </div>
          </div>
        </div>
      </Section>
    </Frame>
  )
}
