import { defineConfig } from '@adonisjs/shield'
import env from '#start/env'

const shieldConfig = defineConfig({
  /**
   * Configure CSP policies for your app. Refer documentation
   * to learn more
   */
  csp: {
    enabled: false,
    directives: {},
    reportOnly: false,
  },

  /**
   * Configure CSRF protection options. Refer documentation
   * to learn more
   */
  csrf: {
    enabled: true,
    exceptRoutes: [
      '/admin/file-managers/upload',
      '/admin/file-managers/upload-many',
      '/admin/file-managers/delete-bulk',
      '/admin/users/*/2fa/generate',
      '/admin/users/*/2fa/enable',
      '/admin/users/*/2fa/disable',
    ],
    enableXsrfCookie: true,
    methods: ['POST', 'PUT', 'PATCH', 'DELETE'],
    cookieOptions: {
      secure: env.get('SESSION_SECURE_COOKIE', false),
    },
  },

  /**
   * Control how your website should be embedded inside
   * iFrames
   */
  xFrame: {
    enabled: true,
    action: 'DENY',
  },

  /**
   * Force browser to always use HTTPS
   */
  hsts: {
    enabled: env.get('SESSION_SECURE_COOKIE', false),
    maxAge: '180 days',
  },

  /**
   * Disable browsers from sniffing the content type of a
   * response and always rely on the "content-type" header.
   */
  contentTypeSniffing: {
    enabled: true,
  },
})

export default shieldConfig
