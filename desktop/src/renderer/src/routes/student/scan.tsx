import { createFileRoute } from '@tanstack/react-router'
import { ScanScreen } from '../../student/scan/ScanScreen'

export const Route = createFileRoute('/student/scan')({
  component: ScanScreen
})
