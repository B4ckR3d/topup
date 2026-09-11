import { cn } from '@umbreon/ui/lib/utils'
import { useSetAtom } from 'jotai'
import { useEffect } from 'react'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'
import {
  data,
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  redirect,
  Scripts,
  ScrollRestoration,
} from 'react-router'
import type { Route } from './+types/root'
import './app.css'
import PwaInstallPrompt from './components/pwa-install-prompt'
import { RouterTopLoader } from './components/top-loader'
import { getInstance, i18nextMiddleware, localeCookie } from './middlewares/i8n'
import { getPublicAppConfig } from './services/app-config.server'
import { getSession } from './session.server'
import { appConfigAtom } from './store/app-config'

export const middleware = [i18nextMiddleware]

export const meta: Route.MetaFunction = ({ data }: { data?: any }) => {
  const appName = data?.appConfig?.appName || 'Umbreon Store'
  const title = `${appName} - Top Up Game & PPOB Termurah, Cepat & Terpercaya`
  const description =
    'Platform top up game Mobile Legends, Free Fire, PUBG, Genshin Impact, voucher game, pulsa, token PLN, dan tagihan PPOB termurah dan terpercaya 24 jam nonstop.'
  const ogImage = 'https://umbreon.store/images/og-thumbnail.png'

  return [
    { title },
    { name: 'description', content: description },
    { name: 'theme-color', content: '#6366f1' },
    { name: 'apple-mobile-web-app-capable', content: 'yes' },
    { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
    { name: 'apple-mobile-web-app-title', content: appName },

    // Open Graph for WhatsApp, Facebook, Telegram, Discord, etc.
    { property: 'og:site_name', content: appName },
    { property: 'og:type', content: 'website' },
    { property: 'og:title', content: title },
    { property: 'og:description', content: description },
    { property: 'og:image', content: ogImage },
    { property: 'og:image:secure_url', content: ogImage },
    { property: 'og:image:type', content: 'image/png' },
    { property: 'og:image:width', content: '1200' },
    { property: 'og:image:height', content: '630' },
    { property: 'og:image:alt', content: `${appName} - Top Up Game & PPOB Terpercaya` },
    { property: 'og:url', content: 'https://umbreon.store' },

    // Twitter Card
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: title },
    { name: 'twitter:description', content: description },
    { name: 'twitter:image', content: ogImage },
  ]
}

export async function loader({ context, request, params }: Route.LoaderArgs) {
  const i18next = getInstance(context)
  const url = new URL(request.url)
  const supportedLangs = ['en', 'id', 'ms']

  // Ambil param locale dari path
  const pathParts = url.pathname.split('/').filter(Boolean)
  const localeParam = pathParts[0]
  // Ambil locale dari cookie
  const cookieLocale = (await localeCookie.parse(request.headers.get('Cookie'))) || null

  // Urutan: param > cookie > default
  let redirectLang = 'id'
  if (localeParam && supportedLangs.includes(localeParam)) {
    redirectLang = localeParam
  } else if (cookieLocale && supportedLangs.includes(cookieLocale)) {
    redirectLang = cookieLocale
  }

  // Jika path tidak diawali localization
  if (!localeParam || !supportedLangs.includes(localeParam)) {
    // Build new path dengan menambahkan locale di depan, path tetap utuh
    let newPath = url.pathname
    // pastikan tidak double slash
    newPath = newPath.startsWith('/') ? newPath : `/${newPath}`
    return redirect(`/${redirectLang}${newPath}`, {
      headers: { 'Set-Cookie': await localeCookie.serialize(redirectLang) },
    })
  }

  const session = await getSession(request.headers.get('Cookie'))
  const flashSuccess = session.get('success')
  const flashError = session.get('error')

  // Load public app config (with 15s caching)
  const appConfig = await getPublicAppConfig()

  // jika sudah match, set locale sesuai param
  await i18next.changeLanguage(localeParam)

  return data(
    {
      locale: localeParam,
      appConfig,
      flash: {
        success: flashSuccess,
        error: flashError,
      },
    },
    { headers: { 'Set-Cookie': await localeCookie.serialize(localeParam) } },
  )
}

export const links: Route.LinksFunction = () => [
  { rel: 'manifest', href: '/manifest.webmanifest' },
  { rel: 'apple-touch-icon', href: '/icons/apple-touch-icon.png', sizes: '180x180' },
  { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/icons/favicon-32x32.png' },
  { rel: 'icon', type: 'image/png', sizes: '16x16', href: '/icons/favicon-16x16.png' },
  { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
  {
    rel: 'preconnect',
    href: 'https://fonts.gstatic.com',
    crossOrigin: 'anonymous',
  },
  {
    rel: 'stylesheet',
    href: 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,200..800;1,200..800&family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&family=Roboto:ital,wght@0,100..900;1,100..900&display=swap',
  },
]

export function Layout({ children }: { children: React.ReactNode }) {
  const { i18n } = useTranslation('common')

  i18n.reloadResources(i18n.language, 'common')

  return (
    <html lang={i18n.language}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body className={cn('antialiased relative bg-background')}>
        <RouterTopLoader />
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  )
}

export default function App({ loaderData }: Route.ComponentProps) {
  // useChangeLanguage(loaderData.locale)
  const setAppConfig = useSetAtom(appConfigAtom)

  useEffect(() => {
    if (loaderData?.appConfig) {
      setAppConfig(loaderData.appConfig)
    }
  }, [loaderData?.appConfig, setAppConfig])

  useEffect(() => {
    if (loaderData?.flash.success) {
      toast.success(loaderData.flash?.success ?? '')
    }

    if (loaderData?.flash.error) {
      toast.error(loaderData.flash?.error ?? '')
    }
  }, [loaderData?.flash])

  return (
    <>
      <Outlet />
      <PwaInstallPrompt />
    </>
  )
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = 'Oops!'
  let details = 'An unexpected error occurred.'
  let stack: string | undefined

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? '404' : 'Error'
    details =
      error.status === 404 ? 'The requested page could not be found.' : error.statusText || details
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message
    stack = error.stack
  }

  return (
    <main className="pt-16 p-4 container mx-auto">
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre className="w-full p-4 overflow-x-auto">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  )
}
