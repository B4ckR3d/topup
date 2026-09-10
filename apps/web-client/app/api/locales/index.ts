import { cacheHeader } from 'pretty-cache-header'
import { data } from 'react-router'
import { z } from 'zod'
import en from '~/locales/en'
import id from '~/locales/id'
import ms from '~/locales/ms'
import type { Route } from '../../+types/root'

const resources = {
  en: en,
  id: id,
  ms: ms,
}

type ResourceKey = keyof typeof resources

function isResourceKey(value: string): value is ResourceKey {
  return value in resources
}

export async function loader({ params }: Route.LoaderArgs) {
  const lng = z.string().safeParse(params.locale)

  if (lng.error) return data({ error: lng.error }, { status: 400 })
  if (!isResourceKey(lng.data)) return data({ error: 'Invalid locale' }, { status: 400 })

  const namespaces = resources[lng.data]
  type NamespaceKey = Extract<keyof typeof namespaces, string>

  function isNamespaceKey(value: string): value is NamespaceKey {
    return value in namespaces
  }

  const ns = z.string().safeParse(params.ns)

  if (ns.error) return data({ error: ns.error }, { status: 400 })
  if (!isNamespaceKey(ns.data)) return data({ error: 'Invalid namespace' }, { status: 400 })

  const headers = new Headers()

  // On production, we want to add cache headers to the response
  if (process.env.NODE_ENV === 'production') {
    headers.set(
      'Cache-Control',
      cacheHeader({
        maxAge: '5m', // Cache in the browser for 5 minutes
        sMaxage: '1d', // Cache in the CDN for 1 day
        // Serve stale content while revalidating for 7 days
        staleWhileRevalidate: '7d',
        // Serve stale content if there's an error for 7 days
        staleIfError: '7d',
      }),
    )
  }

  return data(namespaces[ns.data], { headers })
}
