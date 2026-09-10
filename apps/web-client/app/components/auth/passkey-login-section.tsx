import { Button } from '@umbreon/ui/components/ui/button'
import { Fingerprint } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { usePasskeyLogin } from '~/hooks/use-passkey-login'

interface PasskeyLoginProps {
  email?: string
  isDisabled?: boolean
  autoPrompt?: boolean
}

export function PasskeyLoginSection({
  email,
  isDisabled = false,
  autoPrompt = true,
}: PasskeyLoginProps) {
  const { t } = useTranslation('login')
  const { handlePasskeyLogin, isLoading, isSupported } = usePasskeyLogin({ email })
  const hasAutoPromptedRef = useRef(false)

  useEffect(() => {
    if (!autoPrompt || isDisabled || !isSupported || hasAutoPromptedRef.current) {
      return
    }

    hasAutoPromptedRef.current = true
    void handlePasskeyLogin({
      silent: true,
      preferBrowserAutofill: true,
    })
  }, [autoPrompt, isDisabled, isSupported, handlePasskeyLogin])

  if (!isSupported) {
    return null
  }

  return (
    <div className="space-y-3">
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border/70" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-background text-muted-foreground">{t('or', 'atau')}</span>
        </div>
      </div>

      <Button
        type="button"
        variant="outline"
        size="lg"
        className="w-full border-dashed border-border/70 rounded-lg hover:border-primary/30"
        disabled={isDisabled || isLoading}
        onClick={() => void handlePasskeyLogin()}
        title="Use your device's biometric or security key to login"
      >
        <Fingerprint className="me-2" />
        {isLoading
          ? t('passkeyLoggingIn', 'Authenticating...')
          : t('passkeyLogin', 'Login with Passkey')}
      </Button>

      <p className="text-xs text-center text-muted-foreground">
        {t('passkeyHint', 'Use your fingerprint, face, or security key')}
      </p>
    </div>
  )
}
