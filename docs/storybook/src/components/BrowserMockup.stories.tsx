import type { Meta, StoryObj } from '@storybook/react-vite'
import { Frame, Section } from '../gallery'
const meta = {
  title: 'Maquetas/Browser'
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

export const Gallery: Story = {
  render: () => (
    <Frame>
      <Section title="Navegador">
        <div className="mockup-browser border border-base-300 w-full">
          <div className="mockup-browser-toolbar">
            <div className="input">https://ejemplo.test</div>
          </div>
          <div className="bg-base-100 p-4">Contenido de la página.</div>
        </div>
      </Section>
    </Frame>
  )
}
