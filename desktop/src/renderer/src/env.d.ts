/// <reference types="vite/client" />

interface ImportMetaEnv {
  // Dirección del sitio del alumno para el QR de la clase. Sin ella, http://localhost:5191.
  readonly VITE_STUDENT_SITE_URL?: string
}
