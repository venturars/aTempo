import type { Meta, StoryObj } from '@storybook/react-vite'
import { Frame, Section } from '../gallery'
const meta = {
  title: 'Aviso/Toast'
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

export const Gallery: Story = {
  render: () => (
    <Frame>
      <Section title="Aviso flotante">
        <div className="toast toast-end toast-bottom static">
          <div role="alert" className="alert alert-soft"><span>El cambio ya está guardado.</span></div>
        </div>
      </Section>
      <Section title="Confirmación">
        <div className="toast toast-center toast-bottom static">
          <div className="toast-message" role="status">
            <span className="toast-message-icon" aria-hidden="true">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12.5l4.5 4.5L19 7.5" />
              </svg>
            </span>
            <span className="toast-message-text">Gracias por avisar. Tu profe ya lo sabe.</span>
            <button className="btn btn-ghost btn-xs btn-square" type="button" aria-label="Cerrar">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </div>
        </div>
      </Section>
      <Section title="Visto de éxito">
        <div className="success-mark" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12.5l4.5 4.5L19 7.5" />
          </svg>
        </div>
      </Section>
    </Frame>
  )
}
