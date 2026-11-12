import type { Meta, StoryObj } from '@storybook/react-vite'
import { Frame, Section } from '../gallery'
const meta = {
  title: 'Navegación/Tabs'
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

export const Gallery: Story = {
  render: () => (
    <Frame>
      <Section title="Borde">
        <div role="tablist" className="tabs tabs-border">
          <button role="tab" className="tab tab-active" type="button">Uno</button>
          <button role="tab" className="tab" type="button">Dos</button>
          <button role="tab" className="tab tab-disabled" type="button">Tres</button>
        </div>
      </Section>
      <Section title="Caja">
        <div role="tablist" className="tabs tabs-box">
          <button role="tab" className="tab tab-active" type="button">Uno</button>
          <button role="tab" className="tab" type="button">Dos</button>
          <button role="tab" className="tab tab-disabled" type="button">Tres</button>
        </div>
      </Section>
      <Section title="Elevado">
        <div role="tablist" className="tabs tabs-lift">
          <button role="tab" className="tab tab-active" type="button">Uno</button>
          <button role="tab" className="tab" type="button">Dos</button>
          <button role="tab" className="tab tab-disabled" type="button">Tres</button>
        </div>
      </Section>
      <Section title="Tamaño">
        <div role="tablist" className="tabs tabs-border tabs-lg">
          <button role="tab" className="tab tab-active" type="button">Grande</button>
          <button role="tab" className="tab" type="button">Dos</button>
          <button role="tab" className="tab tab-disabled" type="button">Tres</button>
        </div>
      </Section>
    </Frame>
  )
}
