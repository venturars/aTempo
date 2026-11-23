import type { Meta, StoryObj } from '@storybook/react-vite'
import { Frame, Section } from '../gallery'
const meta = {
  title: 'Entrada/Campo'
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

export const Gallery: Story = {
  render: () => (
    <Frame>
      <Section title="Campo">
        <div className="field w-full max-w-sm">
          <label htmlFor="campo-correo">Correo</label>
          <input id="campo-correo" className="input w-full" type="email" />
        </div>
      </Section>
      <Section title="Opcional">
        <div className="field w-full max-w-sm">
          <label htmlFor="campo-motivo">
            Motivo <span className="field-optional">· opcional</span>
          </label>
          <textarea id="campo-motivo" className="textarea w-full" rows={3} />
        </div>
      </Section>
      <Section title="Select sin valor">
        <div className="field w-full max-w-sm">
          <label htmlFor="campo-hora">Hora</label>
          <select id="campo-hora" className="select w-full" defaultValue="">
            <option value="" disabled>Hora</option>
            <option>09</option>
            <option>10</option>
          </select>
        </div>
      </Section>
      <Section title="Botón de campo">
        <div className="field w-full max-w-sm">
          <label htmlFor="campo-dia">Día</label>
          <button id="campo-dia" className="input field-button" type="button" aria-haspopup="dialog">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
              <rect x="3" y="5" width="18" height="16" rx="2" />
              <path d="M7 2v6m10-6v6M3 11h18" />
            </svg>
            <span className="field-button-value">Hoy, mar 17 nov</span>
          </button>
        </div>
        <div className="field w-full max-w-sm">
          <label htmlFor="campo-archivo">Archivo</label>
          <button id="campo-archivo" className="input field-button" type="button" data-empty="">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
              <path d="M12 5v14M5 12h14" />
            </svg>
            <span className="field-button-value">Añadir PDF o imagen</span>
          </button>
        </div>
      </Section>
      <Section title="Panel de hora">
        <div className="picker-panel">
          <div className="time-columns">
            <div className="time-column" role="group" aria-label="Hora">
              <p className="time-column-title">Hora</p>
              <button type="button" aria-pressed="false">08</button>
              <button type="button" aria-pressed="true">09</button>
              <button type="button" aria-pressed="false">10</button>
            </div>
            <div className="time-column" role="group" aria-label="Min">
              <p className="time-column-title">Min</p>
              <button type="button" aria-pressed="false">16</button>
              <button type="button" aria-pressed="true">17</button>
              <button type="button" aria-pressed="false">18</button>
            </div>
          </div>
        </div>
      </Section>
      <Section title="Campo con botón">
        <div className="field w-full max-w-sm">
          <label htmlFor="campo-codigo">Código de la clase</label>
          <div className="field-row">
            <input id="campo-codigo" className="input w-full" type="text" />
            <button className="btn btn-primary" type="button">Registrar</button>
          </div>
        </div>
      </Section>
      <Section title="Segmento">
        <div className="segment w-full max-w-sm" role="group" aria-label="Tipo">
          <button className="btn" type="button" aria-pressed="true">Retraso</button>
          <button className="btn" type="button" aria-pressed="false">Ausencia</button>
        </div>
      </Section>
    </Frame>
  )
}
