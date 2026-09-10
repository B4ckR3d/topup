import axios from 'axios'

export const apiClient = axios.create({
  withCredentials: true,
  xsrfCookieName: 'XSRF-TOKEN',
  xsrfHeaderName: 'X-XSRF-TOKEN',
  headers: {
    Accept: 'application/json',
  },
})

// Automatically handle multipart/form-data boundary and fallback Content-Type
apiClient.interceptors.request.use((config) => {
  if (config.data instanceof FormData) {
    if (config.headers) {
      delete config.headers['Content-Type']
      delete (config.headers as any)['content-type']
    }
  } else if (
    config.headers &&
    !config.headers['Content-Type'] &&
    !(config.headers as any)['content-type']
  ) {
    config.headers['Content-Type'] = 'application/json'
  }
  return config
})
