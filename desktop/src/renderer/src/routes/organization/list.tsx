import { createFileRoute } from '@tanstack/react-router'
import { fetchOrganizations } from '../../organization/organizationApi'
import {
  OrganizationListError,
  OrganizationListLoading,
  OrganizationListScreen
} from '../../organization/OrganizationListScreen'

export const Route = createFileRoute('/organization/list')({
  loader: () => fetchOrganizations(),
  pendingComponent: OrganizationListLoading,
  errorComponent: OrganizationListError,
  component: OrganizationListScreen
})
