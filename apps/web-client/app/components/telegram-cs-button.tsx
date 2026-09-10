import { useAtomValue } from 'jotai'
import { Send } from 'lucide-react'
import { useState } from 'react'
import { appConfigAtom } from '~/store/app-config'

export default function TelegramCsButton() {
  const appConfig = useAtomValue(appConfigAtom)
  const [isHovered, setIsHovered] = useState(false)

  const telegramUrl =
    appConfig.telegramUrl && appConfig.telegramUrl !== 'https://t.me/'
      ? appConfig.telegramUrl
      : 'https://t.me/hashfunction'

  return (
    <div
      className="fixed bottom-[86px] sm:bottom-[90px] right-3 sm:right-5 md:bottom-7 md:right-7 z-40 select-none pointer-events-auto"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <a
        href={telegramUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Hubungi CS Telegram"
        className="group relative flex items-center gap-2 p-1.5 sm:p-2 rounded-full bg-card/95 border border-border shadow-[0_10px_28px_rgba(0,132,255,0.22),0_4px_12px_rgba(0,0,0,0.1)] hover:shadow-[0_14px_34px_rgba(0,132,255,0.35)] hover:scale-105 active:scale-95 transition-all duration-300 backdrop-blur-md"
      >
        {/* Transparent Umbreon CS Character Mascot */}
        <div className="relative size-12 sm:size-13 flex items-center justify-center shrink-0">
          <img
            src="/images/umbreon_cs_mascot.png"
            alt="CS Umbreon Support"
            className="w-full h-full object-contain filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.3)] group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300"
          />
          {/* Online green indicator dot */}
          <span className="absolute bottom-0 right-0 size-3.5 bg-emerald-500 border-2 border-card rounded-full shadow-sm">
            <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-75" />
          </span>
        </div>

        {/* Text Label Pill (Shows on Desktop or on Mobile hover/active) */}
        <div className="hidden sm:flex flex-col pr-3 pl-0.5 text-left">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-foreground tracking-tight leading-none">
              CS Umbreon
            </span>
            <Send className="size-3 text-[#0084ff] -rotate-12" />
          </div>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1 mt-1">
            <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Online 24/7
          </span>
        </div>

        {/* Floating tooltip on mobile if hovered */}
        {isHovered && (
          <div className="sm:hidden absolute bottom-full right-0 mb-2 px-2.5 py-1 rounded-lg bg-card border border-border text-foreground text-[11px] font-semibold shadow-lg whitespace-nowrap animate-in fade-in zoom-in-95 duration-150">
            Chat CS Telegram
          </div>
        )}
      </a>
    </div>
  )
}
