import type { Meta, StoryObj } from '@storybook/react-vite'
import { Frame, Section } from '../gallery'
const meta = {
  title: 'Layout/Hero'
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

export const Gallery: Story = {
  render: () => (
    <Frame>
      <Section title="Bloque">
        <div className="hero min-h-48 rounded-box bg-base-100">
          <div className="hero-overlay rounded-box"></div>
          <div className="hero-content text-center">
            <div>
              <h3 className="text-2xl font-medium">Título</h3>
              <p className="py-2">Una línea debajo del título.</p>
              <button className="btn btn-primary" type="button">Guardar</button>
            </div>
          </div>
        </div>
      </Section>
    </Frame>
  )
}
