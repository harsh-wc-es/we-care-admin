import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const base = env.VITE_ROUTER_BASE || process.env.VITE_ROUTER_BASE || '/admin/'
  return {
    plugins: [react()],
    base: base.endsWith('/') ? base : `${base}/`,
  }
})