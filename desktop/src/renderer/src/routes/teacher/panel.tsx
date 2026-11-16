import { createFileRoute } from '@tanstack/react-router'
import { PanelScreen } from '../../panel/PanelScreen'

export const Route = createFileRoute('/teacher/panel')({
  component: PanelScreen
})
