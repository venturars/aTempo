import { create } from 'zustand'

// Un mensaje corto que confirma una acción después de cambiar de pantalla.
type FlashState = {
  message: string | null
  showFlash: (message: string) => void
  clearFlash: () => void
}

export const useFlashStore = create<FlashState>((set) => ({
  message: null,
  showFlash: (message) => set({ message }),
  clearFlash: () => set({ message: null })
}))
