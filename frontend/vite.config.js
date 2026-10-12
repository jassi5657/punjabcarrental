import process from 'node:process'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const API = process.env.VITE_API_TARGET || 'http://localhost:5055'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': API,
      '/uploads': API,
    },
  },
})
