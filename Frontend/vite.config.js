import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    open: '/login',
    proxy: {
      '/api': {
        target: 'https://lazycv.onrender.com',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
