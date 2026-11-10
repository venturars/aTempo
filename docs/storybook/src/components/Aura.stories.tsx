import type { Meta, StoryObj } from '@storybook/react-vite'
import { Frame, Section } from '../gallery'
const meta = {
  title: 'Datos/Aura'
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

export const Gallery: Story = {
  render: () => (
    <Frame>
      <Section title="Estilo">
        <div className="aura  text-primary"><button className="btn" type="button">Base</button></div>
        <div className="aura aura-dual text-primary"><button className="btn" type="button">aura-dual</button></div>
        <div className="aura aura-rainbow text-primary"><button className="btn" type="button">aura-rainbow</button></div>
        <div className="aura aura-holo text-primary"><button className="btn" type="button">aura-holo</button></div>
        <div className="aura aura-gold text-primary"><button className="btn" type="button">aura-gold</button></div>
        <div className="aura aura-silver text-primary"><button className="btn" type="button">aura-silver</button></div>
        <div className="aura aura-glow text-primary"><button className="btn" type="button">aura-glow</button></div>
      </Section>
      <Section title="Tamaño">
        <div className="aura aura-xs text-primary"><button className="btn btn-sm" type="button">xs</button></div>
        <div className="aura aura-sm text-primary"><button className="btn btn-sm" type="button">sm</button></div>
        <div className="aura aura-md text-primary"><button className="btn btn-sm" type="button">md</button></div>
        <div className="aura aura-lg text-primary"><button className="btn btn-sm" type="button">lg</button></div>
        <div className="aura aura-xl text-primary"><button className="btn btn-sm" type="button">xl</button></div>
      </Section>
    </Frame>
  )
}
