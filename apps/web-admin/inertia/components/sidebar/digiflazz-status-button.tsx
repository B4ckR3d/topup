import { Button } from '@umbreon/ui/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@umbreon/ui/components/ui/dialog'
import {
  CheckCircle2,
  Copy,
  ExternalLink,
  RefreshCw,
  Server,
  ShieldCheck,
  Wallet,
  XCircle,
  Zap,
} from 'lucide-react'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { formatPrice } from '~/utils'
import { apiClient } from '~/utils/axios'

interface DigiflazzStatusResponse {
  success: boolean
  connected: boolean
  saldo?: number
  message?: string
  error?: string
}

export function DigiflazzStatusButton() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<DigiflazzStatusResponse | null>(null)

  const checkConnection = async () => {
    setLoading(true)
    try {
      const res = await apiClient.get<DigiflazzStatusResponse>('/admin/providers/digiflazz/saldo')
      setResult(res.data)
      if (res.data.connected) {
        toast.success(`Digiflazz Terhubung! Saldo: ${formatPrice(res.data.saldo || 0)}`)
      }
    } catch (err: any) {
      const errData = err.response?.data
      setResult({
        success: false,
        connected: false,
        error: errData?.error || err.message || 'Koneksi ke Digiflazz gagal',
      })
      toast.error('Koneksi Digiflazz bermasalah')
    } finally {
      setLoading(false)
    }
  }

  const handleOpen = (val: boolean) => {
    setOpen(val)
    if (val && !result) {
      checkConnection()
    }
  }

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast.success(`${label} berhasil disalin!`)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 rounded-full border-border/80 bg-background/60 px-3 text-xs font-medium backdrop-blur-sm transition-all hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
        >
          <Zap className="size-3.5 text-amber-500 fill-amber-500/20" />
          <span className="hidden sm:inline">Digiflazz:</span>
          {loading ? (
            <RefreshCw className="size-3 animate-spin text-muted-foreground" />
          ) : result?.connected ? (
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
              {formatPrice(result.saldo || 0)}
            </span>
          ) : result ? (
            <span className="font-medium text-rose-500">Offline / Error</span>
          ) : (
            <span className="text-muted-foreground">Cek Status</span>
          )}
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-semibold">
            <div className="flex size-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Zap className="size-4" />
            </div>
            <span>Integrasi Digiflazz H2H</span>
          </DialogTitle>
          <DialogDescription>
            Pemeriksaan status koneksi real-time, saldo deposit, dan webhook H2H Digiflazz.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Status Box */}
          <div
            className={`rounded-xl border p-4 transition-all ${
              loading
                ? 'border-border/70 bg-muted/30'
                : result?.connected
                  ? 'border-emerald-500/30 bg-emerald-500/5 dark:bg-emerald-500/10'
                  : result
                    ? 'border-rose-500/30 bg-rose-500/5 dark:bg-rose-500/10'
                    : 'border-border/70 bg-card'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Status Koneksi
              </span>
              {loading ? (
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <RefreshCw className="size-3 animate-spin" /> Sedang Memeriksa...
                </span>
              ) : result?.connected ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="size-3.5" /> Normal & Terhubung
                </span>
              ) : result ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 px-2.5 py-0.5 text-xs font-semibold text-rose-600 dark:text-rose-400">
                  <XCircle className="size-3.5" /> Gagal Terhubung
                </span>
              ) : (
                <span className="text-xs text-muted-foreground">Belum diuji</span>
              )}
            </div>

            {/* Saldo Display */}
            {result?.connected && (
              <div className="mt-3 flex items-baseline gap-2">
                <Wallet className="size-5 text-emerald-600 dark:text-emerald-400" />
                <div>
                  <span className="text-2xl font-bold text-foreground">
                    {formatPrice(result.saldo || 0)}
                  </span>
                  <p className="text-xs text-muted-foreground">Saldo Deposit Akun Digiflazz</p>
                </div>
              </div>
            )}

            {/* Error Display */}
            {result && !result.connected && (
              <div className="mt-3 text-xs text-rose-600 dark:text-rose-400">
                <p className="font-semibold">Pesan Error Provider:</p>
                <p className="mt-1 rounded bg-rose-500/10 p-2 font-mono text-[11px] break-all">
                  {result.error || 'Tidak dapat terhubung ke server Digiflazz'}
                </p>
              </div>
            )}
          </div>

          {/* Config Information Checklist */}
          <div className="space-y-2.5 rounded-xl border border-border/70 bg-card/60 p-3.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Server className="size-3.5" /> IP VPS untuk Whitelist:
              </span>
              <button
                type="button"
                onClick={() => copyToClipboard('84.247.148.122', 'IP VPS')}
                className="flex items-center gap-1 font-mono font-medium text-foreground hover:text-primary"
              >
                84.247.148.122 <Copy className="size-3" />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <ShieldCheck className="size-3.5" /> Webhook URL Callback:
              </span>
              <button
                type="button"
                onClick={() =>
                  copyToClipboard('https://api.umbreon.store/callback/h2h/digiflazz', 'Webhook URL')
                }
                className="flex items-center gap-1 font-mono font-medium text-foreground hover:text-primary"
              >
                .../callback/h2h/digiflazz <Copy className="size-3" />
              </button>
            </div>
          </div>

          {/* Whitelist Reminder / Guide */}
          <div className="rounded-lg bg-muted/40 p-3 text-xs text-muted-foreground leading-relaxed">
            <span className="font-semibold text-foreground">💡 Catatan Sinkronisasi:</span>
            <ul className="mt-1.5 list-inside list-disc space-y-1">
              <li>
                Pastikan IP <code className="text-foreground font-mono">84.247.148.122</code> sudah
                didaftarkan di{' '}
                <a
                  href="https://member.digiflazz.com"
                  target="_blank"
                  rel="noreferrer"
                  className="font-medium text-primary inline-flex items-center gap-0.5 hover:underline"
                >
                  member.digiflazz.com <ExternalLink className="size-3" />
                </a>{' '}
                (Menu <em>Pengaturan &gt; Koneksi API &gt; Whitelist IP</em>).
              </li>
              <li>Saldo deposit harus mencukupi agar pesanan customer otomatis diproses.</li>
            </ul>
          </div>
        </div>

        <DialogFooter className="flex flex-row justify-between gap-2 sm:justify-between">
          <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
            Tutup
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={loading}
            onClick={checkConnection}
            className="gap-1.5"
          >
            <RefreshCw className={`size-3.5 ${loading ? 'animate-spin' : ''}`} />
            Uji Ulang Koneksi
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
