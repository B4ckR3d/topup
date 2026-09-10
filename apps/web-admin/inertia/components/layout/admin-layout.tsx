import type { SharedProps } from '@adonisjs/inertia/types'
import { usePage } from '@inertiajs/react'
import { QueryClient } from '@tanstack/react-query'
import { SidebarInset, SidebarProvider } from '@umbreon/ui/components/ui/sidebar'
import { useEffect } from 'react'
import toast from 'react-hot-toast'
import { AppSidebar } from '../sidebar/app-sidebar'
import { SiteHeader } from '../sidebar/site-header'

export const query = new QueryClient()

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { props } = usePage<SharedProps>()

  useEffect(() => {
    if (props.success) {
      // Show success message using toast
      toast.success(props.success)
    }

    if (props.errors) {
      if (props.errors.error) {
        // Show error message using toast
        toast.error(props.errors.error)
      }
    }
  }, [props])

  return (
    <div className="[--header-height:calc(--spacing(16))]">
      <SidebarProvider
        className="flex flex-col"
        style={
          {
            '--sidebar-width': '18.5rem',
            '--sidebar-width-mobile': '20rem',
          } as React.CSSProperties
        }
      >
        <SiteHeader />
        <div className="flex flex-1">
          <AppSidebar />
          <SidebarInset>
            <div className="flex flex-1 flex-col gap-4 p-4 sm:p-6 lg:p-8">{children}</div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </div>
  )
}
