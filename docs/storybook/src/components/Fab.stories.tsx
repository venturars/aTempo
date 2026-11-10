import type { Meta, StoryObj } from '@storybook/react-vite'
import { Frame, Section } from '../gallery'
const meta = {
  title: 'Acciones/FAB'
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

export const Gallery: Story = {
  render: () => (
    <Frame>
      <Section title="Vertical">
        <div className="fab relative">
          <div tabIndex={0} role="button" className="btn btn-lg btn-primary">Abrir</div>
          <button className="btn btn-lg" type="button">Uno</button>
          <button className="btn btn-lg" type="button">Dos</button>
          <div className="fab-close">Cerrar <span className="btn btn-lg">Cerrar</span></div>
        </div>
      </Section>
      <Section title="Flor">
        <div className="fab fab-flower relative">
          <div tabIndex={0} role="button" className="btn btn-lg btn-circle btn-primary">Abrir</div>
          <button className="fab-main-action btn btn-circle btn-lg" type="button">Ir</button>
          <button className="btn btn-lg btn-circle" type="button">1</button>
          <button className="btn btn-lg btn-circle" type="button">2</button>
        </div>
      </Section>
    </Frame>
  )
}
