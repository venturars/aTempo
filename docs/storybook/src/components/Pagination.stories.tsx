import type { Meta, StoryObj } from '@storybook/react-vite'
import { Pagination, type PaginationSize } from 'atempo-ui'
import { useState } from 'react'
import { Frame, Section } from '../gallery'

const meta = {
  title: 'Navegación/Pagination'
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

function PaginationExample(props: { pageCount: number; firstPage: number; size?: PaginationSize }) {
  const [page, setPage] = useState(props.firstPage)
  return (
    <Pagination page={page} pageCount={props.pageCount} onPageChange={setPage} size={props.size} />
  )
}

function FewPages() {
  return <PaginationExample pageCount={5} firstPage={2} />
}

function ManyPages() {
  return <PaginationExample pageCount={20} firstPage={10} />
}

function SmallPages() {
  return <PaginationExample pageCount={12} firstPage={1} size="sm" />
}

export const Gallery: Story = {
  render: () => (
    <Frame>
      <Section title="Pocas páginas">
        <FewPages />
      </Section>
      <Section title="Muchas páginas, con huecos">
        <ManyPages />
      </Section>
      <Section title="Pequeña, para tablas">
        <SmallPages />
      </Section>
    </Frame>
  )
}
