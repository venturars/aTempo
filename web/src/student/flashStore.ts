import { create } from 'zustand'
import type { StudentMessage } from './studentMessage'

// Un mensaje corto que confirma una acción después de cambiar de pantalla.
type FlashState = {
  message: StudentMessage | null
  showFlash: (message: StudentMessage) => void
  clearFlash: () => void
}

export const useFlashStore = create<FlashState>((set) => ({
  message: null,
  showFlash: (message) => set({ message }),
  clearFlash: () => set({ message: null })
}))
