import { Avatar, AvatarFallback, AvatarImage } from '@umbreon/ui/components/ui/avatar'
import { cn } from '@umbreon/ui/lib/utils'
import { useAtomValue } from 'jotai'
import { userAtom } from '~/store/user'
import { navData } from '../header'
import NavLinkWithLocale from '../navlink'

export default function UserSidebarDesktop() {
  const user = useAtomValue(userAtom)

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-card border rounded-xl border-border/70 h-fit sticky top-24">
      <div className="p-4 border-b border-border/70">
        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
          <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
            <Avatar className="w-8 h-8">
              {user.data?.image_url && <AvatarImage src={user.data?.image_url} />}
              <AvatarFallback>
                {user.data?.name
                  ?.split(' ')
                  .map((n) => n[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{user.data?.name}</p>
            <p className="text-xs text-muted-foreground">{user.data?.email || 'Tidak ada email'}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navData.navUser.items.map((item) => {
            return (
              <li key={item.href}>
                <NavLinkWithLocale to={item.href} end={true}>
                  {({ isActive }) => (
                    <div
                      className={cn(
                        'flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-all duration-200',
                        {
                          'bg-primary text-primary-foreground shadow-sm': isActive,
                          'text-muted-foreground hover:bg-muted hover:text-foreground': !isActive,
                        },
                      )}
                    >
                      {item.icon}
                      <span className="text-sm">{item.label}</span>
                    </div>
                  )}
                </NavLinkWithLocale>
              </li>
            )
          })}
        </ul>
      </nav>
    </aside>
  )
}
