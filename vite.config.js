import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/landbyscup/', // <-- VIKTIG! Måste vara repo-namnet!
  plugins: [react()],
})
