import { createDatabase, inArray } from '@umbreon/db'
import { tb } from '@umbreon/db/types'

export interface PublicAppConfig {
  appName: string
  appLogoUrl: string
  appIconUrl: string
  telegramUrl: string
}

let cachedConfig: PublicAppConfig | null = null
let cacheExpiry = 0

export async function getPublicAppConfig(): Promise<PublicAppConfig> {
  const now = Date.now()
  if (cachedConfig && now < cacheExpiry) {
    return cachedConfig
  }

  const fallbackConfig: PublicAppConfig = {
    appName: 'Umbreon Store',
    appLogoUrl: '',
    appIconUrl: '',
    telegramUrl: 'https://t.me/hashfunction',
  }

  const dbUrl =
    process.env.DATABASE_URL ||
    'postgresql://umbreon_admin:Umbr30n_Pg_S3cur3_P@ss_2026!@84.247.148.122:5433/umbreon_db'

  try {
    const { db, close } = createDatabase(dbUrl)
    const items = await db.query.appConfig.findMany({
      where: inArray(tb.appConfig.key, [
        'app.name',
        'app.logo_url',
        'app.icon_url',
        'contact.telegram',
      ]),
    })
    await close()

    const map = new Map(items.map((i) => [i.key, i.value]))
    const s3Url = process.env.VITE_S3_URL || 'http://84.247.148.122:9000/umbreon'

    const formatUrl = (url?: string | null) => {
      if (!url) return ''
      if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
        return url
      }
      return `${s3Url}/${url.replace(/^\/+/, '')}`
    }

    const appName = map.get('app.name') || 'Umbreon Store'
    const appLogoUrl = formatUrl(map.get('app.logo_url') || map.get('app.icon_url'))
    const appIconUrl = formatUrl(map.get('app.icon_url'))

    // Normalize telegram contact
    const rawTg = map.get('contact.telegram')?.trim() || ''
    let telegramUrl = 'https://t.me/hashfunction'
    if (rawTg) {
      if (rawTg.startsWith('http://') || rawTg.startsWith('https://')) {
        telegramUrl = rawTg
      } else if (rawTg.startsWith('@')) {
        telegramUrl = `https://t.me/${rawTg.slice(1)}`
      } else {
        telegramUrl = `https://t.me/${rawTg}`
      }
    }

    cachedConfig = {
      appName,
      appLogoUrl,
      appIconUrl,
      telegramUrl,
    }
    cacheExpiry = now + 15_000 // Cache for 15s to react swiftly to admin changes
    return cachedConfig
  } catch (err) {
    console.error('[AppConfigServer] Error fetching config:', err)
    return fallbackConfig
  }
}
