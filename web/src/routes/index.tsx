import { createFileRoute } from '@tanstack/react-router'
import { LoginScreen } from '../login/LoginScreen'

// El enlace del correo de invitación abre el login con ?invitation=<código>.
type LoginSearch = {
  invitation?: string
}

export const Route = createFileRoute('/')({
  validateSearch: (search: Record<string, unknown>): LoginSearch =>
    search.invitation === undefined ? {} : { invitation: String(search.invitation) },
  component: LoginScreen
})
