import type { Meta, StoryObj } from '@storybook/react-vite'
import { Frame, Section } from '../gallery'
const meta = {
  title: 'Datos/Table'
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

export const Gallery: Story = {
  render: () => (
    <Frame>
      <Section title="Tabla">
        <div className="overflow-x-auto w-full">
          <table className="table">
            <thead>
              <tr><th>Nombre</th><th>Hora</th><th>Nota</th></tr>
            </thead>
            <tbody>
              <tr><td>Ana</td><td className="tabular-nums">09:00</td><td>Listo</td></tr>
              <tr><td>Luis</td><td className="tabular-nums">09:12</td><td>Aviso</td></tr>
            </tbody>
          </table>
        </div>
      </Section>
      <Section title="Cebra y tamaño">
        <table className="table table-zebra table-sm">
          <thead><tr><th>Nombre</th><th>Valor</th></tr></thead>
          <tbody>
            <tr><td>Uno</td><td className="tabular-nums">1</td></tr>
            <tr><td>Dos</td><td className="tabular-nums">2</td></tr>
          </tbody>
        </table>
      </Section>
      <Section title="Panel">
        <div className="panel-card w-full max-w-xl overflow-hidden rounded-box">
          <table className="table panel-table">
            <thead>
              <tr>
                <th scope="col">Fecha</th>
                <th scope="col">Llegada</th>
                <th scope="col">Estado</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>17 nov 2026</td>
                <td>09:02</td>
                <td><span className="badge badge-sm badge-soft badge-success">Presente</span></td>
              </tr>
              <tr>
                <td>16 nov 2026</td>
                <td>09:16</td>
                <td><span className="badge badge-sm badge-soft badge-warning">Tarde</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </Section>
    </Frame>
  )
}
