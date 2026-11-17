import type { Meta, StoryObj } from '@storybook/react-vite'
import { Frame, Section } from '../gallery'

const colors = [
  { name: 'base-100', background: 'bg-base-100', text: 'text-base-content' },
  { name: 'base-200', background: 'bg-base-200', text: 'text-base-content' },
  { name: 'base-300', background: 'bg-base-300', text: 'text-base-content' },
  { name: 'primary', background: 'bg-primary', text: 'text-primary-content' },
  { name: 'secondary', background: 'bg-secondary', text: 'text-secondary-content' },
  { name: 'accent', background: 'bg-accent', text: 'text-accent-content' },
  { name: 'neutral', background: 'bg-neutral', text: 'text-neutral-content' },
  { name: 'info', background: 'bg-info', text: 'text-info-content' },
  { name: 'success', background: 'bg-success', text: 'text-success-content' },
  { name: 'warning', background: 'bg-warning', text: 'text-warning-content' },
  { name: 'error', background: 'bg-error', text: 'text-error-content' }
]

const typeSizes = [
  { name: 'text-2xl', className: 'text-2xl', sample: '28' },
  { name: 'text-xl', className: 'text-xl', sample: '20' },
  { name: 'text-lg', className: 'text-lg', sample: '18' },
  { name: 'text-base', className: 'text-base', sample: '16' },
  { name: 'text-sm', className: 'text-sm', sample: '14' },
  { name: 'text-meta', className: 'text-meta', sample: '13' },
  { name: 'text-xs', className: 'text-xs', sample: '11' }
]

const spaces = [
  { name: '0', className: 'w-0' },
  { name: '1', className: 'w-1' },
  { name: '2', className: 'w-2' },
  { name: '3', className: 'w-3' },
  { name: '4', className: 'w-4' },
  { name: '5', className: 'w-5' },
  { name: '6', className: 'w-6' },
  { name: '8', className: 'w-8' },
  { name: '10', className: 'w-10' },
  { name: '12', className: 'w-12' },
  { name: '16', className: 'w-16' },
  { name: '20', className: 'w-20' },
  { name: '24', className: 'w-24' }
]

const meta = {
  title: 'Fundamentos/Tema'
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

export const Gallery: Story = {
  render: () => (
    <Frame>
      <Section title="Color">
        {colors.map((color) => (
          <div key={color.name} className={`${color.background} ${color.text} w-36 rounded-box p-3`}>
            <p className="text-sm font-medium">{color.name}</p>
            <p className="text-xs">texto</p>
          </div>
        ))}
      </Section>
      <Section title="Tipo">
        <p className="w-full font-normal">Peso 400</p>
        <p className="w-full font-medium">Peso 500</p>
        <p className="w-full font-semibold">Peso 600</p>
        {typeSizes.map((size) => (
          <p key={size.name} className={`${size.className} w-full`}>
            {size.name} · {size.sample}
          </p>
        ))}
      </Section>
      <Section title="Radio">
        <div className="rounded-selector bg-primary text-primary-content px-4 py-2">selector</div>
        <div className="rounded-field bg-base-100 px-4 py-2">field</div>
        <div className="rounded-box bg-base-100 px-4 py-2">box</div>
      </Section>
      <Section title="Espacio">
        {spaces.map((step) => (
          <div key={step.name} className="flex flex-col items-center gap-1">
            <div className={`bg-primary h-4 ${step.className}`}></div>
            <span className="text-xs">{step.name}</span>
          </div>
        ))}
      </Section>
    </Frame>
  )
}
