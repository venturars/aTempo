import { create } from 'zustand'
import type { StudentMessage } from './studentMessage'

// Un mensaje corto que confirma una acción después de cambiar de pantalla.
// Guarda la clave del texto, no el texto: el aviso sigue el idioma elegido.
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
