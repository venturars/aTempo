import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { DayPicker, type DateRange } from 'react-day-picker'
import { es } from 'react-day-picker/locale'
import 'react-day-picker/style.css'
import { Frame, Section } from '../gallery'
const meta = {
  title: 'Entrada/Calendar'
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

const month = new Date(2026, 10, 1)

function RangeCalendar() {
  const [range, setRange] = useState<DateRange | undefined>({
    from: new Date(2026, 10, 2),
    to: new Date(2026, 10, 6)
  })
  return (
    <DayPicker
      className="react-day-picker"
      locale={es}
      mode="range"
      hideNavigation
      defaultMonth={month}
      selected={range}
      onSelect={setRange}
    />
  )
}

function MultipleCalendar() {
  const [days, setDays] = useState<Date[] | undefined>([
    new Date(2026, 10, 3),
    new Date(2026, 10, 5),
    new Date(2026, 10, 10),
    new Date(2026, 10, 12)
  ])
  return (
    <DayPicker
      className="react-day-picker"
      locale={es}
      mode="multiple"
      hideNavigation
      defaultMonth={month}
      selected={days}
      onSelect={setDays}
    />
  )
}

export const Gallery: Story = {
  render: () => (
    <Frame>
      <Section title="Intervalo">
        <RangeCalendar />
      </Section>
      <Section title="Varias fechas sueltas">
        <MultipleCalendar />
      </Section>
    </Frame>
  )
}
