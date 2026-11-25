import { ElectronAPI } from '@electron-toolkit/preload'
import type { RouterRequest, RouterResponse } from './router'

export type AuthUser = { sub: string; email: string }

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      auth: {
        isConfigured: () => Promise<boolean>
        login: (credentials: { email: string; password: string }) => Promise<AuthUser>
        register: (credentials: { email: string; password: string }) => Promise<AuthUser>
        me: () => Promise<AuthUser | null>
        logout: () => Promise<void>
      }
      router: {
        request: (request: RouterRequest) => Promise<RouterResponse>
      }
    }
  }
}
