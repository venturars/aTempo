import type { Meta, StoryObj } from '@storybook/react-vite'
import { Frame, Section } from '../gallery'
import placeholder from '../assets/placeholder.svg'
const meta = {
  title: 'Datos/Avatar'
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

export const Gallery: Story = {
  render: () => (
    <Frame>
      <Section title="Estado">
        <div className="avatar">
          <div className="w-16 rounded-full">
            <img src={placeholder} alt="Ana" />
          </div>
        </div>
        <div className="avatar avatar-online">
          <div className="w-16 rounded-full">
            <img src={placeholder} alt="En línea" />
          </div>
        </div>
        <div className="avatar avatar-offline">
          <div className="w-16 rounded-full">
            <img src={placeholder} alt="Fuera de línea" />
          </div>
        </div>
        <div className="avatar avatar-placeholder">
          <div className="w-16 rounded-full bg-base-300 text-base-content">
            <span>AN</span>
          </div>
        </div>
      </Section>
      <Section title="Grupo">
        <div className="avatar-group -space-x-4">
          <div className="avatar">
            <div className="w-12">
              <img src={placeholder} alt="Uno" />
            </div>
          </div>
          <div className="avatar">
            <div className="w-12">
              <img src={placeholder} alt="Dos" />
            </div>
          </div>
        </div>
      </Section>
      <Section title="Iniciales con tono">
        <div className="avatar avatar-placeholder">
          <div className="w-8 rounded-full text-xs font-semibold avatar-tone-primary"><span>AL</span></div>
        </div>
        <div className="avatar avatar-placeholder">
          <div className="w-8 rounded-full text-xs font-semibold avatar-tone-success"><span>MD</span></div>
        </div>
        <div className="avatar avatar-placeholder">
          <div className="w-8 rounded-full text-xs font-semibold avatar-tone-info"><span>SC</span></div>
        </div>
        <div className="avatar avatar-placeholder">
          <div className="w-8 rounded-full text-xs font-semibold avatar-tone-warning"><span>ED</span></div>
        </div>
        <div className="avatar avatar-placeholder">
          <div className="w-8 rounded-full text-xs font-semibold avatar-tone-secondary"><span>MM</span></div>
        </div>
        <div className="avatar avatar-placeholder">
          <div className="w-8 rounded-full text-xs font-semibold avatar-tone-error"><span>JR</span></div>
        </div>
      </Section>
    </Frame>
  )
}
