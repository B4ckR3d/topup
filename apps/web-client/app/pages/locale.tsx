import { GoogleOAuthProvider } from '@react-oauth/google'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { Provider } from 'jotai'
import { Outlet } from 'react-router'
import UserLayout from '~/components/layout/user-layout'
import SetPinWrapper from '~/components/set-pin-wrapper'
import { queryClient, store } from '~/store/store'
import type { Route } from './+types'

export default function Locale(_args: Route.ComponentProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <Provider store={store}>
        <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
          <SetPinWrapper>
            <UserLayout>
              <Outlet />
            </UserLayout>
          </SetPinWrapper>
        </GoogleOAuthProvider>
        <ReactQueryDevtools initialIsOpen={false} />
      </Provider>
    </QueryClientProvider>
  )
}
