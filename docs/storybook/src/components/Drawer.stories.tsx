import type { Meta, StoryObj } from '@storybook/react-vite'
import { Frame, Section } from '../gallery'
const meta = {
  title: 'Layout/Drawer'
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

export const Gallery: Story = {
  render: () => (
    <Frame>
      <Section title="Cajón">
        <div className="drawer h-48 rounded-box bg-base-100">
          <input id="cajon-guia" className="drawer-toggle" type="checkbox" />
          <div className="drawer-content p-4">
            <label htmlFor="cajon-guia" className="btn drawer-button">Abrir</label>
          </div>
          <div className="drawer-side">
            <label htmlFor="cajon-guia" className="drawer-overlay" aria-label="Cerrar"></label>
            <ul className="menu bg-base-200 min-h-full w-48 p-4">
              <li><a>Uno</a></li>
              <li><a>Dos</a></li>
            </ul>
          </div>
        </div>
      </Section>
    </Frame>
  )
}
