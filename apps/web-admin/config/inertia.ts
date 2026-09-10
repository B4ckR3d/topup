import { defineConfig } from '@adonisjs/inertia'

const inertiaConfig = defineConfig({
  /**
   * Path to the Edge view that will be used as the root view for Inertia responses
   */
  rootView: 'inertia_layout',

  /**
   * Options for the server-side rendering.
   * Disabled for Admin Dashboard (Inertia SPA mode) to optimize performance, memory, and avoid SSR module resolution issues.
   */
  ssr: {
    enabled: false,
  },
})

export default inertiaConfig
