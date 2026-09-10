import {
  browserSupportsWebAuthn,
  startAuthentication,
  startRegistration,
} from '@simplewebauthn/browser'
import axios from 'axios'
import toast from 'react-hot-toast'
import { deviceIdAtom } from '~/store/device-id'
import { store } from '~/store/store'
import { apiClient } from '~/utils/axios'
import { generateDeviceIdSync } from '~/utils/device-id'

const PASSKEY_BROWSER_HINT_KEY = '__umbreon.passkey.browser_hint'

export interface PasskeyRegisterOptions {
  challenge_token: string
  options: PublicKeyCredentialCreationOptions
}

export interface PasskeyLoginOptions {
  challenge_token: string
  options: PublicKeyCredentialRequestOptions
}

export interface PasskeyRegistrationResponse {
  success: boolean
  message: string
}

export interface PasskeyLoginResponse {
  success: boolean
  message: string
  data: {
    access_token: string
    refresh_token: string
    access_token_expired_at: string
    refresh_token_expired_at: string
    user: {
      id: string
      email: string
      name: string
      is_banned: boolean
      role: string
    }
    device: {
      name: string
      fingerprint: string
      type: string
      is_umbreon_app?: boolean
      login_from: string
    }
  }
}

interface LoginWithPasskeyParams {
  email?: string
  preferBrowserAutofill?: boolean
}

interface PasskeyRequestOptions {
  suppressErrorToast?: boolean
}

function getErrorMessage(error: unknown, fallbackMessage: string): string {
  if (axios.isAxiosError(error)) {
    return (
      (error.response?.data as { message?: string } | undefined)?.message ||
      error.message ||
      fallbackMessage
    )
  }

  if (error instanceof Error) {
    return error.message
  }

  return fallbackMessage
}

function ensureDeviceId(): string {
  const currentDeviceId = store.get(deviceIdAtom)

  if (currentDeviceId) {
    return currentDeviceId
  }

  const generatedDeviceId = generateDeviceIdSync()
  store.set(deviceIdAtom, generatedDeviceId)

  return generatedDeviceId
}

function markBrowserHasPasskey(): void {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(PASSKEY_BROWSER_HINT_KEY, '1')
}

export function browserHasStoredPasskeyHint(): boolean {
  if (typeof window === 'undefined') {
    return false
  }

  return window.localStorage.getItem(PASSKEY_BROWSER_HINT_KEY) === '1'
}

/**
 * Check if WebAuthn is supported in the browser
 */
export function isWebAuthnSupported(): boolean {
  return browserSupportsWebAuthn()
}

/**
 * Get registration options from server
 */
export async function getPasskeyRegisterOptions(): Promise<PasskeyRegisterOptions> {
  try {
    const response = await apiClient.post('/auth/passkey/register/options')
    return response.data.data as PasskeyRegisterOptions
  } catch (error: unknown) {
    const message = getErrorMessage(error, 'Failed to get registration options')
    toast.error(message)
    throw new Error(message)
  }
}

/**
 * Register a new passkey
 */
export async function registerPasskey(): Promise<PasskeyRegistrationResponse> {
  if (!isWebAuthnSupported()) {
    throw new Error('WebAuthn is not supported in your browser')
  }

  try {
    // Step 1: Get registration options from server
    const { challenge_token, options } = await getPasskeyRegisterOptions()

    // Step 2: Start WebAuthn registration
    const attResp = await startRegistration({ optionsJSON: options as any })

    // Step 3: Verify registration on server
    const response = await apiClient.post('/auth/passkey/register/verify', {
      challenge_token,
      response: attResp,
    })

    markBrowserHasPasskey()

    return response.data as PasskeyRegistrationResponse
  } catch (error: unknown) {
    const message = getErrorMessage(error, 'Passkey registration failed')
    toast.error(message)
    throw new Error(message)
  }
}

/**
 * Get login options from server
 */
export async function getPasskeyLoginOptions(
  email?: string,
  requestOptions?: PasskeyRequestOptions,
): Promise<PasskeyLoginOptions> {
  try {
    const response = await apiClient.post('/auth/passkey/login/options', email ? { email } : {})
    return response.data.data as PasskeyLoginOptions
  } catch (error: unknown) {
    const message = getErrorMessage(error, 'Failed to get login options')
    if (!requestOptions?.suppressErrorToast) {
      toast.error(message)
    }
    throw new Error(message)
  }
}

/**
 * Login with passkey
 */
export async function loginWithPasskey(
  params?: string | LoginWithPasskeyParams,
  requestOptions?: PasskeyRequestOptions,
): Promise<PasskeyLoginResponse> {
  if (!isWebAuthnSupported()) {
    throw new Error('WebAuthn is not supported in your browser')
  }

  try {
    const loginParams: LoginWithPasskeyParams =
      typeof params === 'string' ? { email: params } : (params ?? {})

    const deviceId = ensureDeviceId()

    // Step 1: Get login options from server
    const { challenge_token, options } = await getPasskeyLoginOptions(
      loginParams.email,
      requestOptions,
    )

    // Step 2: Start WebAuthn authentication
    const assertResp = await startAuthentication({
      optionsJSON: options as any,
      useBrowserAutofill: Boolean(loginParams.preferBrowserAutofill),
    })

    const verifyPayload = {
      challenge_token,
      response: assertResp,
      ...(loginParams.email ? { email: loginParams.email } : {}),
    }

    // Step 3: Verify authentication on server
    const response = await apiClient.post('/auth/passkey/login/verify', verifyPayload, {
      headers: {
        'X-Device-ID': deviceId,
      },
    })

    markBrowserHasPasskey()

    return response.data as PasskeyLoginResponse
  } catch (error: unknown) {
    const message = getErrorMessage(error, 'Passkey login failed')
    if (!requestOptions?.suppressErrorToast) {
      toast.error(message)
    }
    throw new Error(message)
  }
}
