import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// Repassa as chamadas /api para o backend. Assim o site funciona acessado de
// outro computador (ex.: via SSH/rede) sem precisar expor a porta 3000.
const proxy = { '/api': 'http://localhost:3000' }

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { proxy },
  preview: { proxy },
})
