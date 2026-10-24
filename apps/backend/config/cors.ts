import { defineConfig } from '@adonisjs/cors'
import env from '#start/env'

/**
 * Configuration options to tweak the CORS policy. The following
 * options are documented on the official documentation website.
 *
 * https://docs.adonisjs.com/guides/security/cors
 */
const corsConfig = defineConfig({
  enabled: true,

  /**
   * Set origin to true to allow requests from any origin, or specify
   * allowed origins. For production, use environment variables to
   * configure allowed origins.
   */
  origin: (() => {
    const configured = env.get('CORS_ORIGIN')
    const frontendUrl = env.get('FRONTEND_URL')
    const defaultOrigins = [
      'https://account-hrnexus.netlify.app',
      'https://singular-mooncake-7833e7.netlify.app',
      'http://localhost:4200',
      'http://localhost:3000',
    ]

    if (frontendUrl && !defaultOrigins.includes(frontendUrl)) {
      defaultOrigins.push(frontendUrl)
    }

    if (!configured) {
      return defaultOrigins
    }

    const origins = configured
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean)

    for (const item of defaultOrigins) {
      if (!origins.includes(item)) origins.push(item)
    }
    return origins
  })(),

  methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE'],
  headers: true,
  exposeHeaders: [],
  credentials: true,
  maxAge: 90,
})

export default corsConfig
