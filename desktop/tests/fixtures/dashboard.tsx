import { createRoot } from 'react-dom/client'
import '../../src/renderer/src/styles/app.css'
import { OrganizationDashboardScreen } from '../../src/renderer/src/organization/OrganizationDashboardScreen'
import {
  emptyOrganizationExample,
  incompleteOrganizationExample,
  organizationExample
} from '../../src/renderer/src/organization/organizationExample'

const state = new URLSearchParams(window.location.search).get('state')
const model =
  state === 'empty'
    ? emptyOrganizationExample
    : state === 'incomplete'
      ? incompleteOrganizationExample
      : organizationExample

createRoot(document.getElementById('root')!).render(<OrganizationDashboardScreen model={model} />)
