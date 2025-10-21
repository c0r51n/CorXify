import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// 👉 Das ist die magische Zeile: base: "./"
export default defineConfig({
  plugins: [react()],
  base: "./"
})
