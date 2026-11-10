import type { Meta, StoryObj } from '@storybook/react-vite'
import { Frame, Section } from '../gallery'
const meta = {
  title: 'Aviso/Skeleton'
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

export const Gallery: Story = {
  render: () => (
    <Frame>
      <Section title="Carga">
        <div className="skeleton h-8 w-40"></div>
        <div className="skeleton h-16 w-16 rounded-full"></div>
        <div className="flex flex-col gap-2">
          <div className="skeleton h-4 w-64"></div>
          <div className="skeleton h-4 w-48"></div>
        </div>
      </Section>
    </Frame>
  )
}
