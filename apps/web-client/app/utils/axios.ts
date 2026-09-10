import axios from 'axios'
import { v4 } from 'uuid'
import { API_URL } from '~/common/constant'
import { store } from '~/store/store'
import { authTokenAtom } from '~/store/token'
import { deviceIdAtom } from '../store/device-id'

export const getApiBaseUrl = () => {
  if (typeof window === 'undefined') {
    return process.env.INTERNAL_API_URL || 'http://web-api:9991'
  }
  const envUrl = import.meta.env.VITE_API_URL
  if (envUrl && !envUrl.includes('localhost')) {
    return envUrl
  }
  return `${window.location.protocol}//${window.location.hostname}:9991`
}

export const apiClient = axios.create({
  baseURL: API_URL,
})

apiClient.interceptors.request.use((config) => {
  config.baseURL = getApiBaseUrl()
  const deviceId = store.get(deviceIdAtom)
  const accessToken = store.get(authTokenAtom)

  if (deviceId) {
    config.headers = config.headers || {}
    config.headers['X-Device-ID'] = deviceId
  }

  if (accessToken?.accessToken) {
    config.headers = config.headers || {}
    config.headers.Authorization = `Bearer ${accessToken.accessToken}`
  }

  config.headers['X-Version'] = '1.0.0'

  if (!config.headers['X-Request-ID']) {
    config.headers['X-Request-ID'] = v4()
  }

  if (!config.headers['X-Time']) {
    config.headers['X-Time'] = Date.now()
  }

  return config
})
