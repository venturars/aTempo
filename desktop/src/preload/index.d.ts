import { ElectronAPI } from '@electron-toolkit/preload'

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
    }
  }
}
