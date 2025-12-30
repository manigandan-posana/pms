import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Pre-bundle and avoid externalizing MUI packages which can cause
  // Vite import-analysis failures due to package export maps.
  optimizeDeps: {
    include: [
      '@mui/material',
      '@mui/system',
      '@mui/x-date-pickers',
      '@mui/x-date-pickers/AdapterDayjs'
    ]
  },
  ssr: {
    noExternal: ['@mui/x-date-pickers']
  }
})
