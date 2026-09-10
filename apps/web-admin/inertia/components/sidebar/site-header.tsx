'use client'

import { usePage } from '@inertiajs/react'
import { Button } from '@umbreon/ui/components/ui/button'
import { useSidebar } from '@umbreon/ui/components/ui/sidebar'
import { Dot, PanelLeft } from 'lucide-react'
import { DigiflazzStatusButton } from './digiflazz-status-button'
import { GatewayStatusDialog } from './gateway-status-dialog'
import { SearchForm } from './search-form'

export function SiteHeader() {
  const { toggleSidebar } = useSidebar()
  const { url } = usePage()
  const pathname = url.split('?')[0]
  const segments = pathname.split('/').filter(Boolean)
  const pageName = segments.at(-1)?.replace(/-/g, ' ') ?? 'dashboard'
  const sectionName = segments.at(-2)?.replace(/-/g, ' ') ?? 'admin'

  const toTitleCase = (value: string) =>
    value
      .split(' ')
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ')

  return (
    <header className="sticky top-0 z-50 flex w-full items-center border-b border-border/70 bg-background/95 backdrop-blur-sm">
      <div className="flex h-(--header-height) w-full items-center gap-3 px-4 sm:px-6 lg:px-8">
        <Button
          className="h-9 w-9 rounded-md border border-border bg-card text-foreground shadow-sm hover:bg-primary/10 hover:text-primary"
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
        >
          <PanelLeft className="size-4" />
        </Button>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground sm:text-[15px]">
            {toTitleCase(pageName)}
          </p>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <span className="truncate">Umbreon Store Admin</span>
            <Dot className="size-3" />
            <span className="truncate capitalize">{toTitleCase(sectionName)}</span>
          </div>
        </div>
        <GatewayStatusDialog />
        <DigiflazzStatusButton />
        <SearchForm className="hidden lg:block lg:w-[260px]" />
      </div>
    </header>
  )
}
