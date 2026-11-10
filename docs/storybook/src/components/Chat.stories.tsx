import type { Meta, StoryObj } from '@storybook/react-vite'
import { Frame, Section } from '../gallery'
import placeholder from '../assets/placeholder.svg'
const meta = {
  title: 'Datos/Chat'
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

export const Gallery: Story = {
  render: () => (
    <Frame>
      <Section title="Lados">
        <div className="w-full max-w-md">
          <div className="chat chat-start">
            <div className="chat-image avatar"><div className="w-10 rounded-full"><img src={placeholder} alt="Ana" /></div></div>
            <div className="chat-header">Ana <time className="text-xs opacity-50">12:00</time></div>
            <div className="chat-bubble">Hola.</div>
            <div className="chat-footer opacity-50">Entregado</div>
          </div>
          <div className="chat chat-end">
            <div className="chat-header">Tú <time className="text-xs opacity-50">12:01</time></div>
            <div className="chat-bubble chat-bubble-primary">Hola.</div>
          </div>
        </div>
      </Section>
      <Section title="Color">
        <div className="chat chat-start"><div className="chat-bubble">Neutro</div></div>
        <div className="chat chat-start"><div className="chat-bubble chat-bubble-primary">Guardar</div></div>
        <div className="chat chat-start"><div className="chat-bubble chat-bubble-secondary">Seguir</div></div>
        <div className="chat chat-start"><div className="chat-bubble chat-bubble-accent">Marcar</div></div>
        <div className="chat chat-start"><div className="chat-bubble chat-bubble-info">Aviso</div></div>
        <div className="chat chat-start"><div className="chat-bubble chat-bubble-success">Listo</div></div>
        <div className="chat chat-start"><div className="chat-bubble chat-bubble-warning">Revisar</div></div>
        <div className="chat chat-start"><div className="chat-bubble chat-bubble-error">Borrar</div></div>
      </Section>
    </Frame>
  )
}
