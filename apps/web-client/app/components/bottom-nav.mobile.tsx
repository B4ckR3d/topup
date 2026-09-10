import { useAtomValue } from 'jotai'
import { Home, LayoutGrid, ShoppingBag, User } from 'lucide-react'
import { useLocation } from 'react-router'
import { appConfigAtom } from '~/store/app-config'
import { userAtom } from '~/store/user'
import LinkWithLocale from './link'
import NavLinkWithLocale from './navlink'

export default function BottomNavMobile() {
  const location = useLocation()
  const appConfig = useAtomValue(appConfigAtom)
  const user = useAtomValue(userAtom)

  // Current path without locale prefix (e.g. /id/check-order -> /check-order)
  const pathname = location.pathname.replace(/^\/(?:en|id|ms)(?=\/|$)/, '') || '/'

  const isHomeActive = pathname === '/'
  const isOrdersActive = pathname.startsWith('/check-order') || pathname.startsWith('/user/orders')
  const isCatalogActive =
    pathname.startsWith('/price-list') ||
    pathname.startsWith('/order') ||
    pathname.startsWith('/offers')
  const isUserActive = pathname.startsWith('/user') && !pathname.startsWith('/user/orders')
  const isAuthActive = pathname.startsWith('/auth')

  const logoUrl = appConfig.appLogoUrl || appConfig.appIconUrl

  return (
    <div
      className="fixed bottom-4 sm:bottom-5 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-[390px] md:hidden pointer-events-auto select-none"
      role="navigation"
      aria-label="Mobile Navigation Bar"
    >
      {/* Floating Pill Dock - Seamless Theme Integration */}
      <div className="relative h-[66px] rounded-[32px] bg-card/95 backdrop-blur-2xl border border-border/80 shadow-[0_12px_36px_rgba(0,0,0,0.15),0_2px_8px_rgba(0,0,0,0.06)] dark:shadow-[0_16px_40px_rgba(0,0,0,0.6),0_2px_8px_rgba(255,255,255,0.03)] px-3 flex items-center justify-between transition-colors">
        {/* Item 1: Home */}
        <NavLinkWithLocale
          to="/"
          end
          className="relative flex-1 h-full flex flex-col items-center justify-center group"
          title="Beranda"
        >
          {({ isActive }) => {
            const active = isActive || isHomeActive
            return (
              <>
                {/* Active Indicator Top Bar */}
                {active && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[3.5px] bg-primary dark:bg-foreground rounded-full shadow-[0_0_8px_rgba(0,132,255,0.6)] dark:shadow-[0_0_10px_rgba(255,255,255,0.9)] animate-in fade-in zoom-in-75 duration-200" />
                )}
                <Home
                  className={`size-[23px] transition-all duration-200 ${
                    active
                      ? 'text-primary dark:text-foreground stroke-[2.2] scale-105'
                      : 'text-muted-foreground group-hover:text-foreground stroke-[1.8]'
                  }`}
                />
              </>
            )
          }}
        </NavLinkWithLocale>

        {/* Item 2: Shopping Bag / Cek Pesanan */}
        <NavLinkWithLocale
          to={user.isSuccess && user?.data?.role ? '/user/orders' : '/check-order'}
          className="relative flex-1 h-full flex flex-col items-center justify-center group"
          title="Pesanan / Cek Order"
        >
          {({ isActive }) => {
            const active = isActive || isOrdersActive
            return (
              <>
                {active && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[3.5px] bg-primary dark:bg-foreground rounded-full shadow-[0_0_8px_rgba(0,132,255,0.6)] dark:shadow-[0_0_10px_rgba(255,255,255,0.9)] animate-in fade-in zoom-in-75 duration-200" />
                )}
                <ShoppingBag
                  className={`size-[23px] transition-all duration-200 ${
                    active
                      ? 'text-primary dark:text-foreground stroke-[2.2] scale-105'
                      : 'text-muted-foreground group-hover:text-foreground stroke-[1.8]'
                  }`}
                />
              </>
            )
          }}
        </NavLinkWithLocale>

        {/* Item 3: Center Elevated Button with Logo (Umbreon / Panel Admin Logo) */}
        <div className="relative flex-1 h-full flex items-center justify-center -mt-6">
          <LinkWithLocale
            to="/"
            className="group relative flex items-center justify-center w-[54px] h-[54px] rounded-[20px] bg-[#0084ff] hover:bg-[#0076e6] active:scale-95 transition-all duration-200 shadow-[0_10px_24px_rgba(0,132,255,0.45),0_2px_4px_rgba(0,0,0,0.2)] border-[3.5px] border-background overflow-hidden"
            title="Umbreon Store"
          >
            {/* Subtle glow highlight inside center squircle */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/25 via-transparent to-black/15 pointer-events-none" />

            {logoUrl ? (
              <img
                src={logoUrl}
                alt="Logo Umbreon"
                className="w-7 h-7 object-contain filter drop-shadow group-hover:scale-105 transition-transform duration-200"
              />
            ) : (
              /* Umbreon Iconic 4-Petal Squircle Emblem */
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="w-7 h-7 text-white filter drop-shadow group-hover:scale-105 transition-transform duration-200"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 2C9.5 2 7.5 4 7.5 6.5C7.5 9 9.5 11 12 11C14.5 11 16.5 9 16.5 6.5C16.5 4 14.5 2 12 2Z"
                  fill="currentColor"
                />
                <path
                  d="M12 13C9.5 13 7.5 15 7.5 17.5C7.5 20 9.5 22 12 22C14.5 22 16.5 20 16.5 17.5C16.5 15 14.5 13 12 13Z"
                  fill="currentColor"
                />
                <path
                  d="M6.5 7.5C4 7.5 2 9.5 2 12C2 14.5 4 16.5 6.5 16.5C9 16.5 11 14.5 11 12C11 9.5 9 7.5 6.5 7.5Z"
                  fill="currentColor"
                />
                <path
                  d="M17.5 7.5C15 7.5 13 9.5 13 12C13 14.5 15 16.5 17.5 16.5C20 16.5 22 14.5 22 12C22 9.5 20 7.5 17.5 7.5Z"
                  fill="currentColor"
                />
              </svg>
            )}
          </LinkWithLocale>
        </div>

        {/* Item 4: Grid / Katalog / Price List */}
        <NavLinkWithLocale
          to="/price-list"
          className="relative flex-1 h-full flex flex-col items-center justify-center group"
          title="Daftar Harga & Katalog"
        >
          {({ isActive }) => {
            const active = isActive || isCatalogActive
            return (
              <>
                {active && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[3.5px] bg-primary dark:bg-foreground rounded-full shadow-[0_0_8px_rgba(0,132,255,0.6)] dark:shadow-[0_0_10px_rgba(255,255,255,0.9)] animate-in fade-in zoom-in-75 duration-200" />
                )}
                <LayoutGrid
                  className={`size-[22px] transition-all duration-200 ${
                    active
                      ? 'text-primary dark:text-foreground stroke-[2.2] scale-105'
                      : 'text-muted-foreground group-hover:text-foreground stroke-[1.8]'
                  }`}
                />
              </>
            )
          }}
        </NavLinkWithLocale>

        {/* Item 5: User Profile / Akun */}
        <NavLinkWithLocale
          to={user.isSuccess && user?.data ? '/user' : '/auth/login'}
          className="relative flex-1 h-full flex flex-col items-center justify-center group"
          title="Akun Saya"
        >
          {({ isActive }) => {
            const active = isActive || isUserActive || isAuthActive
            return (
              <>
                {active && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[3.5px] bg-primary dark:bg-foreground rounded-full shadow-[0_0_8px_rgba(0,132,255,0.6)] dark:shadow-[0_0_10px_rgba(255,255,255,0.9)] animate-in fade-in zoom-in-75 duration-200" />
                )}
                <User
                  className={`size-[23px] transition-all duration-200 ${
                    active
                      ? 'text-primary dark:text-foreground stroke-[2.2] scale-105'
                      : 'text-muted-foreground group-hover:text-foreground stroke-[1.8]'
                  }`}
                />
              </>
            )
          }}
        </NavLinkWithLocale>
      </div>
    </div>
  )
}
