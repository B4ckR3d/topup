import { zodResolver } from '@hookform/resolvers/zod'
import { GoogleLogin } from '@react-oauth/google'
import { Button } from '@umbreon/ui/components/ui/button'
import { useAtom } from 'jotai'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router'
import { z } from 'zod'
import { PasskeyLoginSection } from '~/components/auth/passkey-login-section'
import { UnderlinedInput } from '~/components/form-fields'
import { useFormMutation } from '~/hooks/use-form-mutation'
import { getInstance } from '~/middlewares/i8n'
import { browserHasStoredPasskeyHint } from '~/services/passkey'
import { queryClient } from '~/store/store'
import { authTokenAtom } from '~/store/token'
import { apiClient } from '~/utils/axios'
import type { Route } from './+types/login'

const schema = z.object({
  email: z.string().email('Email tidak valid'),
  password: z.string().min(1, 'Password wajib diisi'),
})

type Schema = z.infer<typeof schema>

export async function loader({ context }: Route.LoaderArgs) {
  const { t } = getInstance(context)

  return {
    meta: {
      title: `${t('appName', { ns: 'common' })} | Login`,
      description:
        'Login ke Umbreon Store untuk membeli pulsa, voucher game, dan berbagai produk PPOB dengan mudah dan aman.',
    },
  }
}

export default function Login({ loaderData }: Route.ComponentProps) {
  const { t, i18n } = useTranslation('login')
  const navigate = useNavigate()

  const [, setAuthToken] = useAtom(authTokenAtom)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [, setIsPasskeyPromptOpen] = useState(false)
  const [isCheckingSecurity, setIsCheckingSecurity] = useState(false)
  const [, setPostLoginRoute] = useState<string | null>(null)

  const form = useForm({
    resolver: zodResolver(schema),
  })
  const emailValue = form.watch('email') || ''

  const handleAuthSuccess = (data: any) => {
    toast.success(t('loginSuccess'))
    setAuthToken({
      accessToken: data.access_token,
      accessTokenExpiresAt: data.access_token_expired_at,
      refreshToken: data.refresh_token,
      refreshTokenExpiresAt: data.refresh_token_expired_at,
    })
    queryClient.invalidateQueries({
      queryKey: ['userAtom'],
      exact: false,
    })
    form.reset()
    navigate(`/${i18n.language}/user/profile`, {
      replace: true,
    })
  }

  const handleEmailLoginSuccess = async (data: any) => {
    toast.success(t('loginSuccess'))

    setAuthToken({
      accessToken: data.access_token,
      accessTokenExpiresAt: data.access_token_expired_at,
      refreshToken: data.refresh_token,
      refreshTokenExpiresAt: data.refresh_token_expired_at,
    })

    const defaultRedirect = `/${i18n.language}/user/profile`
    queryClient.invalidateQueries({
      queryKey: ['userAtom'],
      exact: false,
    })
    form.reset()

    setIsCheckingSecurity(true)

    try {
      const securityResponse = await apiClient.get('/user/security-info', {
        headers: {
          Authorization: `Bearer ${data.access_token}`,
        },
      })

      const hasPasskey = Boolean(securityResponse?.data?.data?.has_passkey)
      const hasBrowserPasskey = browserHasStoredPasskeyHint()

      if (!hasPasskey && !hasBrowserPasskey) {
        setPostLoginRoute(defaultRedirect)
        setIsPasskeyPromptOpen(true)
        return
      }
    } catch {
      // Fallback: if security-info check fails, continue normal flow
    } finally {
      setIsCheckingSecurity(false)
    }

    navigate(defaultRedirect, {
      replace: true,
    })
  }

  const login = useFormMutation({
    form,
    mutationKey: ['login'],
    mutationFn: async (data: Schema) =>
      apiClient
        .post('/auth/login', data)
        .then((res) => res.data.data)
        .catch((err) => {
          throw new Error(err.response?.data?.message || 'Login failed. Please try again.')
        }),
    onError: (error) => {
      toast.error(error.message)
    },
    onSuccess: (data) => {
      void handleEmailLoginSuccess(data)
    },
  })

  const handleGoogleSuccess = async (credentialResponse: { credential?: string }) => {
    if (!credentialResponse.credential) {
      toast.error('Token Google tidak lengkap')
      return
    }

    setIsGoogleLoading(true)

    try {
      const res = await apiClient.post('/auth/google', {
        id_token: credentialResponse.credential,
      })

      handleAuthSuccess(res.data.data)
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Login Google gagal, coba lagi')
    } finally {
      setIsGoogleLoading(false)
    }
  }

  const handleGoogleError = () => {
    toast.error('Login Google dibatalkan atau gagal')
    setIsGoogleLoading(false)
  }

  const handleSubmit = (data: Schema) => {
    login.mutate(data)
  }

  return (
    <>
      <title>{loaderData?.meta.title}</title>
      <meta property="og:title" content={loaderData.meta.title} />
      <meta name="description" content={loaderData.meta.description} />

      <main className="container max-w-md   mx-auto p-6 md:p-0">
        <div className="mx-auto text-center mt-10">
          <h1 className="text-2xl font-bold mb-4">{t('title')}</h1>
          <p className="text-muted-foreground text-sm">{t('subtitle')}</p>
        </div>

        <form
          onSubmit={form.handleSubmit(handleSubmit)}
          method="post"
          className="max-w-md mx-auto space-y-4 mt-5"
        >
          <div>
            <UnderlinedInput
              label={t('emailLabel')}
              type="email"
              {...form.register('email')}
              error={form.formState.errors.email?.message}
            />
          </div>
          <div>
            <UnderlinedInput
              label={t('passwordLabel')}
              type="password"
              {...form.register('password')}
              error={form.formState.errors.password?.message}
            />

            <div className="text-end">
              <Link to="/auth/forgot-password" className="text-xs mt-1 hover:text-primary">
                {t('forgotPassword')}
              </Link>
            </div>
          </div>
          <Button type="submit" size="lg" className="w-full rounded-lg" disabled={login.isPending}>
            {login.isPending ? 'Loading...' : t('submitButton')}
          </Button>
        </form>

        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">{t('orLoginWith')}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3">
          <div
            className={
              isGoogleLoading || login.isPending || isCheckingSecurity
                ? 'pointer-events-none opacity-60'
                : undefined
            }
          >
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              text="signin_with"
              shape="pill"
              size="large"
              width="100%"
              useOneTap
            />
          </div>

          <PasskeyLoginSection
            email={emailValue}
            isDisabled={login.isPending || isGoogleLoading || isCheckingSecurity}
            autoPrompt
          />
        </div>

        <div className="text-center text-sm text-muted-foreground mt-8">
          {t('noAccount')}{' '}
          <Link to="/auth/register" className="text-primary font-medium hover:underline">
            {t('registerLinkText')}
          </Link>
        </div>
      </main>
    </>
  )
}
