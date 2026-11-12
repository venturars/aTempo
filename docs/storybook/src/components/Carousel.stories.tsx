import type { Meta, StoryObj } from '@storybook/react-vite'
import { Frame, Section } from '../gallery'
import placeholder from '../assets/placeholder.svg'
const meta = {
  title: 'Datos/Carousel'
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

export const Gallery: Story = {
  render: () => (
    <Frame>
      <Section title="Carrusel">
        <div className="carousel w-full max-w-md rounded-box">
          <div className="carousel-item w-full"><img src={placeholder} alt="Primera" /></div>
          <div className="carousel-item w-full"><img src={placeholder} alt="Segunda" /></div>
        </div>
        <div className="carousel carousel-center max-w-md space-x-4 rounded-box bg-base-100 p-4">
          <div className="carousel-item"><img src={placeholder} alt="Centro" className="w-40" /></div>
          <div className="carousel-item"><img src={placeholder} alt="Siguiente" className="w-40" /></div>
        </div>
      </Section>
    </Frame>
  )
}
