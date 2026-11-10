import type { Meta, StoryObj } from '@storybook/react-vite'
import { Frame, Section } from '../gallery'
import placeholder from '../assets/placeholder.svg'
const meta = {
  title: 'Datos/Card'
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

export const Gallery: Story = {
  render: () => (
    <Frame>
      <Section title="Tarjeta">
        <div className="card w-80 bg-base-100">
          <figure><img src={placeholder} alt="Imagen de la tarjeta" /></figure>
          <div className="card-body">
            <h3 className="card-title">Título</h3>
            <p>Una línea que explica la tarjeta.</p>
            <div className="card-actions justify-end">
              <button className="btn btn-primary" type="button">Guardar</button>
            </div>
          </div>
        </div>
        <div className="card card-side w-full max-w-xl bg-base-100">
          <figure className="w-40"><img src={placeholder} alt="Imagen lateral" /></figure>
          <div className="card-body">
            <h3 className="card-title">Al lado</h3>
            <p>La imagen queda a un lado.</p>
          </div>
        </div>
        <div className="card card-border w-80 bg-base-100">
          <div className="card-body">
            <h3 className="card-title">Con borde</h3>
            <p>El borde marca la tarjeta.</p>
          </div>
        </div>
      </Section>
    </Frame>
  )
}
