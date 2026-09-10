export const API_URL =
  typeof window === 'undefined'
    ? process.env.INTERNAL_API_URL || 'http://web-api:9991'
    : import.meta.env.VITE_API_URL || 'http://localhost:9991'
export const DEFAULT_LOCALE = 'id'
export const SUPPORTED_LANGUAGES = ['en', 'id', 'ms']
export const DEFAULT_THEME = 'light'
export const SUPPORTED_THEMES = ['light', 'dark', 'system']
export const DEVICE_ID_KEY = 'deviceId'
export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''

export const ACCESS_TOKEN = '_umbreon.auth_token'
export const REFRESH_TOKEN = '_umbreon.refresh_token'
export const REFRESH_TOKEN_EXPIRED_AT = '_umbreon.refresh_token_expired_at'
export const ACCESS_TOKEN_EXPIRED_AT = '_umbreon.access_token_expired_at'

export const SESSION_KEY = '__umbreon.session'

export const APP_VERSION = import.meta.env.VITE_APP_VERSION || '1.0.0'
