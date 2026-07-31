import path from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// The default build (`npm run build`) targets the Electron desktop shell, which loads
// dist/index.html via file:// — relative asset paths are required there since absolute
// "/assets/..." paths resolve to the filesystem root under file:// and fail.
//
// The web build (`npm run build:web`, deployed on Vercel) is served over real HTTP from
// the domain root, so it needs an absolute "/" base instead, and writes to a separate
// output directory so it can never overwrite or interfere with the Electron dist/ folder.
const isWebBuild = process.env.DEPLOY_TARGET === 'web'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: isWebBuild ? '/' : './',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: isWebBuild ? 'dist-web' : 'dist',
    chunkSizeWarningLimit: 1000,
  },
})
