import { Button } from '@umbreon/ui/components/ui/button'
import { useAtomValue } from 'jotai'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'
import { useNavigate, useSearchParams } from 'react-router'
import LinkWithLocale from '~/components/link'
import { getInstance } from '~/middlewares/i8n'
import { registerPasskey } from '~/services/passkey'
import { authTokenAtom } from '~/store/token'
import { userAtom } from '~/store/user'
import type { Route } from './+types/passkey-register'

export async function loader({ context }: Route.LoaderArgs) {
  const { t } = getInstance(context)

  return {
    meta: {
      title: `${t('appName', { ns: 'common' })} | Register Passkey`,
      description: 'Setup passkey untuk login yang lebih cepat dan aman.',
    },
  }
}

export default function PasskeyRegisterPage({ loaderData }: Route.ComponentProps) {
  const { t, i18n } = useTranslation('login')
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const authToken = useAtomValue(authTokenAtom)
  const user = useAtomValue(userAtom)

  const nextPath = searchParams.get('next') || `/${i18n.language}/user/profile`

  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!authToken?.accessToken) {
      toast.error('Anda harus login terlebih dahulu')
      navigate(`/${i18n.language}/auth/login`, { replace: true })
    }
  }, [authToken?.accessToken, i18n.language, navigate])

  const handleRegisterPasskey = async () => {
    if (!authToken?.accessToken) {
      toast.error('Sesi login tidak ditemukan')
      return
    }

    setIsLoading(true)

    try {
      const result = await registerPasskey()
      toast.success(result.message || 'Passkey berhasil didaftarkan')
      navigate(nextPath, { replace: true })
    } catch (error) {
      console.error('Failed to register passkey:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <title>{loaderData?.meta.title}</title>
      <meta property="og:title" content={loaderData.meta.title} />
      <meta name="description" content={loaderData.meta.description} />

      <main className="container mx-auto p-6 md:p-0">
        <div className="max-w-md mx-auto mt-10 space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold">Register Passkey</h1>
            <p className="text-sm text-muted-foreground">
              Tambahkan passkey agar login lebih cepat menggunakan biometrik atau security key.
            </p>
          </div>

          <div className="rounded-xl border border-border bg-card text-card-foreground p-5 space-y-4">
            <Button
              type="button"
              size="lg"
              className="w-full rounded-lg"
              onClick={handleRegisterPasskey}
              disabled={isLoading}
            >
              {isLoading ? 'Memproses...' : 'Daftarkan Passkey'}
            </Button>

            <div className="text-center text-sm text-muted-foreground">
              <LinkWithLocale to={`/`} className="text-primary hover:underline">
                Kembali ke Home
              </LinkWithLocale>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}
