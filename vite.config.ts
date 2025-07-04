import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './', // Electron için gerekli
  build: {
    outDir: 'dist',
  },
  server: {
    port: 5173,
    strictPort: true, // Port değiştirilmesini engelle
    host: 'localhost',
  },
})
