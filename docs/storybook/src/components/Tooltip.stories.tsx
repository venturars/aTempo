import type { Meta, StoryObj } from '@storybook/react-vite'
import { Frame, Section } from '../gallery'
const meta = {
  title: 'Aviso/Tooltip'
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

export const Gallery: Story = {
  render: () => (
    <Frame>
      <Section title="Posición">
        <div className="tooltip tooltip-open" data-tip="Arriba"><button className="btn" type="button">Arriba</button></div>
        <div className="tooltip tooltip-open tooltip-bottom" data-tip="Abajo"><button className="btn" type="button">Abajo</button></div>
        <div className="tooltip tooltip-open tooltip-left" data-tip="Izquierda"><button className="btn" type="button">Izquierda</button></div>
        <div className="tooltip tooltip-open tooltip-right tooltip-primary" data-tip="Derecha"><button className="btn" type="button">Derecha</button></div>
      </Section>
    </Frame>
  )
}
