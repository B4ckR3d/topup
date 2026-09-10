import { reactRouter } from '@react-router/dev/vite'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [tailwindcss(), reactRouter()],
  resolve: {
    tsconfigPaths: true,
  },
  // resolve: {
  //   preserveSymlinks: true,
  // },
  ssr: {
    noExternal: ['@umbreon/ui'],
  },
})
