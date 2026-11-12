import type { Meta, StoryObj } from '@storybook/react-vite'
import { Frame, Section } from '../gallery'
const meta = {
  title: 'Acciones/Modal'
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

export const Gallery: Story = {
  render: () => (
    <Frame>
      <Section title="Caja">
        <div className="modal-box">
          <h3 className="text-lg font-medium">Título</h3>
          <p className="py-4">El cambio ya está guardado.</p>
          <div className="modal-action">
            <button className="btn" type="button">Cerrar</button>
            <button className="btn btn-primary" type="button">Guardar</button>
          </div>
        </div>
      </Section>
      <Section title="Diálogo">
        <button
          className="btn"
          type="button"
          onClick={() => {
            const dialog = document.getElementById('modal-ejemplo')
            if (dialog instanceof HTMLDialogElement) dialog.showModal()
          }}
        >
          Abrir
        </button>
        <dialog id="modal-ejemplo" className="modal modal-middle">
          <div className="modal-box">
            <h3 className="text-lg font-medium">Título</h3>
            <p className="py-4">Puedes cerrar este diálogo.</p>
            <div className="modal-action">
              <form method="dialog">
                <button className="btn" type="submit">Cerrar</button>
              </form>
            </div>
          </div>
          <form method="dialog" className="modal-backdrop">
            <button type="submit">Cerrar</button>
          </form>
        </dialog>
      </Section>
    </Frame>
  )
}
