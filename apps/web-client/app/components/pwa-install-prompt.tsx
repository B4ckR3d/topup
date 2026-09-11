import { Button } from '@umbreon/ui/components/ui/button'
import { Download, Share, X } from 'lucide-react'
import { useEffect, useState } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

export default function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isVisible, setIsVisible] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)

  useEffect(() => {
    // 1. Cek apakah sudah running dalam mode PWA / Standalone
    const checkStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true

    setIsStandalone(checkStandalone)
    if (checkStandalone) {
      return
    }

    // 2. Cek apakah user sudah pernah menutup prompt dalam 7 hari terakhir
    const dismissedAt = localStorage.getItem('pwa_prompt_dismissed_at')
    if (dismissedAt) {
      const days = (Date.now() - Number(dismissedAt)) / (1000 * 60 * 60 * 24)
      if (days < 7) {
        return
      }
    }

    // 3. Deteksi iOS Safari
    const ua = window.navigator.userAgent.toLowerCase()
    const isIosDevice = /iphone|ipad|ipod/.test(ua)
    const isSafari = /safari/.test(ua) && !/chrome|crios|fxios/.test(ua)

    if (isIosDevice && isSafari) {
      setIsIOS(true)
      // Tampilkan banner dengan delay halus 2 detik agar tidak mengganggu first load
      const timer = setTimeout(() => setIsVisible(true), 2000)
      return () => clearTimeout(timer)
    }

    // 4. Listen ke beforeinstallprompt untuk Android / Chromium / Desktop
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      // Tampilkan notifikasi / alert setelah delay 1.5 detik
      setTimeout(() => setIsVisible(true), 1500)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    // Deteksi jika aplikasi berhasil di-install
    window.addEventListener('appinstalled', () => {
      setIsVisible(false)
      setDeferredPrompt(null)
      localStorage.setItem('pwa_installed', 'true')
    })

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return

    try {
      await deferredPrompt.prompt()
      const choiceResult = await deferredPrompt.userChoice

      if (choiceResult.outcome === 'accepted') {
        setIsVisible(false)
      }
      setDeferredPrompt(null)
    } catch (err) {
      console.error('[PWA Install Error]:', err)
    }
  }

  const handleDismiss = () => {
    setIsVisible(false)
    localStorage.setItem('pwa_prompt_dismissed_at', Date.now().toString())
  }

  if (!isVisible || isStandalone) {
    return null
  }

  return (
    <div className="fixed bottom-20 md:bottom-6 left-4 right-4 md:left-auto md:right-6 md:max-w-md z-50 animate-in fade-in slide-in-from-bottom-5 duration-300">
      <div className="relative overflow-hidden rounded-2xl border border-primary/30 bg-zinc-950/95 p-4 md:p-5 shadow-2xl backdrop-blur-xl ring-1 ring-white/10">
        {/* Glow accent */}
        <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-primary/20 blur-2xl pointer-events-none" />

        {/* Close Button */}
        <button
          type="button"
          onClick={handleDismiss}
          className="absolute top-3 right-3 p-1 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition"
          aria-label="Tutup"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-start gap-3.5 pr-6">
          <img
            src="/icons/icon-192x192.png"
            alt="Umbreon Store Icon"
            className="w-13 h-13 rounded-xl shadow-md border border-white/10 shrink-0 object-cover"
          />
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-primary px-1.5 py-0.5 rounded bg-primary/10">
                PWA App
              </span>
            </div>
            <h4 className="text-sm md:text-base font-bold text-white tracking-tight leading-snug">
              Tambahkan ke Layar Utama
            </h4>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Pasang aplikasi <strong className="text-zinc-200">Umbreon Store</strong> untuk akses
              instan, hemat kuota, dan transaksi 24 jam tanpa hambatan.
            </p>
          </div>
        </div>

        {/* iOS Specific Instructions vs Android/Desktop Native Install */}
        {isIOS ? (
          <div className="mt-3.5 pt-3 border-t border-white/10 text-xs text-zinc-300 space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary/20 text-primary font-bold text-[10px]">
                1
              </span>
              <span>
                Ketuk tombol <strong>Bagikan</strong>{' '}
                <Share className="inline w-3.5 h-3.5 mx-1 text-primary" /> di menu Safari bawah.
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary/20 text-primary font-bold text-[10px]">
                2
              </span>
              <span>
                Gulir ke bawah dan pilih <strong>"Tambahkan ke Layar Utama"</strong>.
              </span>
            </div>
          </div>
        ) : (
          <div className="mt-4 flex items-center justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              className="text-xs text-zinc-400 hover:text-white"
            >
              Nanti Saja
            </Button>
            <Button
              size="sm"
              onClick={handleInstallClick}
              className="text-xs font-semibold gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/25"
            >
              <Download className="w-3.5 h-3.5" />
              Install Sekarang
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
