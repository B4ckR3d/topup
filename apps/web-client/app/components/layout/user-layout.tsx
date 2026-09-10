import { useAtom, useAtomValue } from 'jotai'
import { useHydrateAtoms } from 'jotai/utils'
import { queryClientAtom } from 'jotai-tanstack-query'
import { useEffect } from 'react'
import { Toaster } from 'react-hot-toast'
import { deviceIdAtom } from '~/store/device-id'
import { queryClient } from '~/store/store'
import { themeAtom } from '~/store/theme'
import { authTokenAtom } from '~/store/token'
import { userAtom } from '~/store/user'
import { generateDeviceIdSync } from '~/utils/device-id'
import BottomNavMobile from '../bottom-nav.mobile'
import FooterSection from '../footer'
import Header from '../header'
import Sidebar from '../sidebar'
import TelegramCsButton from '../telegram-cs-button'

export default function UserLayout({ children }: { children: React.ReactNode }) {
  useHydrateAtoms([[queryClientAtom, queryClient]])

  const theme = useAtomValue(themeAtom)
  const [deviceId, setDeviceId] = useAtom(deviceIdAtom)
  const [tokens, setTokens] = useAtom(authTokenAtom)
  const user = useAtomValue(userAtom)

  // Clear expired/invalid auth token when user.isError
  useEffect(() => {
    if (tokens && user.isError) {
      setTokens(null)
    }
  }, [tokens, user.isError, setTokens])

  useEffect(() => {
    if (!deviceId) {
      setDeviceId(generateDeviceIdSync())
    }
  }, [deviceId, setDeviceId])

  useEffect(() => {
    document.documentElement.className = theme === 'dark' ? 'dark' : ''
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 p-4 pb-28 md:pb-6">{children}</main>
      <Sidebar />
      <TelegramCsButton />
      <BottomNavMobile />
      <Toaster position="top-right" reverseOrder={false} />
      <FooterSection />
    </div>
  )
}
