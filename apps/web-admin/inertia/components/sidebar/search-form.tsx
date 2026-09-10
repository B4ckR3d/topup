import { Label } from '@umbreon/ui/components/ui/label'
import { SidebarInput } from '@umbreon/ui/components/ui/sidebar'
import { Search } from 'lucide-react'

export function SearchForm({ ...props }: React.ComponentProps<'form'>) {
  return (
    <form {...props}>
      <div className="relative">
        <Label htmlFor="search" className="sr-only">
          Search
        </Label>
        <SidebarInput
          id="search"
          placeholder="Search menu..."
          className="h-9 rounded-md border-border/70 bg-card/90 pl-8 text-sm shadow-sm focus-visible:border-primary/40 focus-visible:ring-primary/30"
        />
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground select-none" />
      </div>
    </form>
  )
}
