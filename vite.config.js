import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // Escuchar en todas las interfaces de red
    port: 5173, // Puerto por defecto de Vite
    strictPort: false, // Si el puerto está ocupado, intentar el siguiente
    open: false, // No abrir automáticamente el navegador
  },
})
