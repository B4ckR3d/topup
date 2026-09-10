import { useAtom } from 'jotai'
import { useCallback, useState } from 'react'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { isWebAuthnSupported, loginWithPasskey } from '~/services/passkey'
import { queryClient } from '~/store/store'
import { authTokenAtom } from '~/store/token'

interface UsePasskeyLoginOptions {
  email?: string
  onSuccess?: () => void
}

interface HandlePasskeyLoginOptions {
  email?: string
  silent?: boolean
  preferBrowserAutofill?: boolean
}

export function usePasskeyLogin({ email, onSuccess }: UsePasskeyLoginOptions) {
  const [isLoading, setIsLoading] = useState(false)
  const [, setAuthToken] = useAtom(authTokenAtom)
  const navigate = useNavigate()
  const { i18n } = useTranslation()

  const handlePasskeyLogin = useCallback(
    async (options?: HandlePasskeyLoginOptions) => {
      if (!isWebAuthnSupported()) {
        if (!options?.silent) {
          toast.error('WebAuthn is not supported in your browser')
        }
        return
      }

      setIsLoading(true)

      try {
        const result = await loginWithPasskey(
          {
            email: options?.email ?? email,
            preferBrowserAutofill: options?.preferBrowserAutofill,
          },
          {
            suppressErrorToast: options?.silent,
          },
        )

        // Save tokens to state
        setAuthToken({
          accessToken: result.data.access_token,
          accessTokenExpiresAt: result.data.access_token_expired_at,
          refreshToken: result.data.refresh_token,
          refreshTokenExpiresAt: result.data.refresh_token_expired_at,
        })

        // Invalidate user queries
        queryClient.invalidateQueries({
          queryKey: ['userAtom'],
          exact: false,
        })

        toast.success(result.message || 'Login successful')

        // Redirect to dashboard
        navigate(`/${i18n.language}/user/profile`, {
          replace: true,
        })

        onSuccess?.()
      } catch (error) {
        if (!options?.silent) {
          // Toast already shown in passkey service
          console.error('Passkey login failed:', error)
        }
      } finally {
        setIsLoading(false)
      }
    },
    [email, i18n.language, navigate, onSuccess, setAuthToken],
  )

  return {
    isLoading,
    handlePasskeyLogin,
    isSupported: isWebAuthnSupported(),
  }
}
