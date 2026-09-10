import { atom } from 'jotai'

export interface AppConfigState {
  appName: string
  appLogoUrl: string
  appIconUrl: string
  telegramUrl: string
}

export const appConfigAtom = atom<AppConfigState>({
  appName: 'Umbreon Store',
  appLogoUrl: '',
  appIconUrl: '',
  telegramUrl: 'https://t.me/hashfunction',
})
