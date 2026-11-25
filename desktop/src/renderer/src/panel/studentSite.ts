// Dirección del sitio del alumno que abre el QR. El móvil tiene que llegar a ella, así que en clase
// es la del ordenador en la wifi: VITE_STUDENT_SITE_URL=http://192.168.1.20:5191 pnpm dev
export const studentSiteUrl = import.meta.env.VITE_STUDENT_SITE_URL || 'http://localhost:5191'
