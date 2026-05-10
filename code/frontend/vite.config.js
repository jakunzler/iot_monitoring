import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Carrega `.env` de `code/` (partilhado com deploy scripts), não só de `code/frontend/`.
// Variáveis expostas ao cliente continuam a precisar do prefixo `VITE_` (ver https://vitejs.dev/guide/env-and-mode.html ).
export default defineConfig({
  envDir: path.resolve(__dirname, '..'),
  plugins: [react()],
  server: {
    port: 3000,
    host: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
  define: {
    'process.env.NODE_ENV': '"production"',
  },
})
