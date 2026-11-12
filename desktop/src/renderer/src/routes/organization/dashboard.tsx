import { createFileRoute } from '@tanstack/react-router'
import { UnderConstructionScreen } from '../../underConstruction/UnderConstructionScreen'

export const Route = createFileRoute('/organization/dashboard')({
  component: () => <UnderConstructionScreen title="Dashboard de organización" />
})
