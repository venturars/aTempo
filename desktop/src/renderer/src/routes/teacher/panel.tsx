import { createFileRoute } from '@tanstack/react-router'
import { UnderConstructionScreen } from '../../underConstruction/UnderConstructionScreen'

export const Route = createFileRoute('/teacher/panel')({
  component: () => <UnderConstructionScreen title="Panel del profesor" />
})
