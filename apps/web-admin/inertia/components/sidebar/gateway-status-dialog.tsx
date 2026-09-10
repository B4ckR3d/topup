import { Badge } from '@umbreon/ui/components/ui/badge'
import { Button } from '@umbreon/ui/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@umbreon/ui/components/ui/dialog'
import {
  Activity,
  AlertCircle,
  CheckCircle2,
  Copy,
  CreditCard,
  Layers,
  Loader2,
  RefreshCw,
  Server,
  Wallet,
  Zap,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { apiClient } from '~/utils/axios'

export type GatewayItem = {
  id: string
  name: string
  type: 'payment_gateway' | 'h2h_provider'
  status: 'connected' | 'error' | 'not_configured'
  latencyMs: number
  balance?: number | string
  message: string
  details?: Record<string, any>
}

const DEFAULT_GATEWAYS: GatewayItem[] = [
  {
    id: 'klikqris',
    name: 'KlikQRIS (Dynamic QRIS)',
    type: 'payment_gateway',
    status: 'connected',
    latencyMs: 0,
    message: 'Klik tombol untuk menguji koneksi API',
  },
  {
    id: 'tripay',
    name: 'TriPay Payment Gateway',
    type: 'payment_gateway',
    status: 'connected',
    latencyMs: 0,
    message: 'Klik tombol untuk menguji koneksi API',
  },
  {
    id: 'duitku',
    name: 'Duitku Payment Gateway',
    type: 'payment_gateway',
    status: 'connected',
    latencyMs: 0,
    message: 'Klik tombol untuk menguji koneksi API',
  },
  {
    id: 'digiflazz',
    name: 'Digiflazz H2H Provider',
    type: 'h2h_provider',
    status: 'connected',
    latencyMs: 0,
    message: 'Klik tombol untuk menguji koneksi API & cek saldo',
  },
  {
    id: 'vipreseller',
    name: 'VIP-Reseller H2H Provider',
    type: 'h2h_provider',
    status: 'connected',
    latencyMs: 0,
    message: 'Klik tombol untuk menguji koneksi API & cek saldo',
  },
]

export function GatewayStatusDialog() {
  const [open, setOpen] = useState(false)
  const [loadingAll, setLoadingAll] = useState(false)
  const [testingId, setTestingId] = useState<string | null>(null)
  const [gateways, setGateways] = useState<GatewayItem[]>(DEFAULT_GATEWAYS)

  const handleTestAll = async () => {
    setLoadingAll(true)
    try {
      const res = await apiClient.get<{ success: boolean; gateways: GatewayItem[] }>(
        '/admin/gateways/test-all',
      )
      if (res.data?.gateways) {
        setGateways(res.data.gateways)
        toast.success('Pengujian koneksi gateway selesai!')
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Gagal menguji gateway')
    } finally {
      setLoadingAll(false)
    }
  }

  const handleTestSingle = async (gatewayId: string) => {
    setTestingId(gatewayId)
    try {
      const res = await apiClient.get<GatewayItem>(`/admin/gateways/test/${gatewayId}`)
      if (res.data) {
        setGateways((prev) => prev.map((g) => (g.id === gatewayId ? { ...g, ...res.data } : g)))
        if (res.data.status === 'connected') {
          toast.success(`${res.data.name} terhubung normal!`)
        } else {
          toast.error(`${res.data.name}: ${res.data.message}`)
        }
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.error || `Gagal menguji ${gatewayId}`)
    } finally {
      setTestingId(null)
    }
  }

  useEffect(() => {
    if (open) {
      handleTestAll()
    }
  }, [open])

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast.success(`${label} berhasil disalin!`)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-2 border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20 shadow-xs"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <Layers className="size-3.5" />
          <span className="hidden sm:inline font-medium text-xs">Gateway & H2H</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between gap-2 mr-6">
            <div className="flex items-center gap-2">
              <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Activity className="size-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-semibold">
                  Status Gateway & Provider H2H
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  Monitor konektivitas real-time seluruh Payment Gateway dan H2H Stok Provider.
                </DialogDescription>
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={handleTestAll}
              disabled={loadingAll}
              className="gap-1.5 h-8 text-xs shrink-0"
            >
              <RefreshCw className={`size-3.5 ${loadingAll ? 'animate-spin' : ''}`} />
              {loadingAll ? 'Menguji...' : 'Test Semua'}
            </Button>
          </div>
        </DialogHeader>

        {/* Info Box IP Whitelist */}
        <div className="rounded-xl border border-border/80 bg-muted/40 p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="space-y-0.5">
            <div className="font-semibold text-foreground flex items-center gap-1.5">
              <Server className="size-3.5 text-primary" />
              IP Publik VPS Server:
            </div>
            <p className="text-muted-foreground">
              Wajib terdaftar di IP Whitelist Member Digiflazz & VIP-Reseller.
            </p>
          </div>
          <div className="flex items-center gap-2 bg-background px-2.5 py-1.5 rounded-lg border border-border shadow-xs font-mono text-foreground font-medium">
            <span>84.247.148.122</span>
            <button
              type="button"
              onClick={() => copyToClipboard('84.247.148.122', 'IP Server')}
              className="text-muted-foreground hover:text-foreground"
              title="Salin IP"
            >
              <Copy className="size-3.5" />
            </button>
          </div>
        </div>

        {/* Gateway List */}
        <div className="space-y-3 mt-1">
          {gateways.map((item) => {
            const isSingleLoading = testingId === item.id
            const isConnected = item.status === 'connected'
            const isNotConfigured = item.status === 'not_configured'

            return (
              <div
                key={item.id}
                className={`rounded-xl border p-3.5 transition-all ${
                  isConnected
                    ? 'border-emerald-500/30 bg-emerald-500/5'
                    : isNotConfigured
                      ? 'border-amber-500/30 bg-amber-500/5'
                      : 'border-red-500/30 bg-red-500/5'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <div
                      className={`mt-0.5 flex size-7 items-center justify-center rounded-lg shrink-0 ${
                        item.type === 'h2h_provider'
                          ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400'
                          : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                      }`}
                    >
                      {item.type === 'h2h_provider' ? (
                        <Zap className="size-4" />
                      ) : (
                        <CreditCard className="size-4" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm text-foreground">{item.name}</span>
                        {isConnected && (
                          <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 text-[10px] h-5 gap-1 font-medium">
                            <CheckCircle2 className="size-3" />
                            Terkoneksi
                          </Badge>
                        )}
                        {isNotConfigured && (
                          <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30 text-[10px] h-5 gap-1 font-medium">
                            <AlertCircle className="size-3" />
                            Belum Dikonfigurasi
                          </Badge>
                        )}
                        {item.status === 'error' && (
                          <Badge className="bg-red-500/15 text-red-700 dark:text-red-400 border border-red-500/30 text-[10px] h-5 gap-1 font-medium">
                            <AlertCircle className="size-3" />
                            Error
                          </Badge>
                        )}
                        {item.latencyMs > 0 && (
                          <span className="text-[10px] text-muted-foreground font-mono">
                            {item.latencyMs}ms
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 break-words">
                        {item.message}
                      </p>
                      {item.balance !== undefined && (
                        <div className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-foreground">
                          <Wallet className="size-3.5 text-primary" />
                          <span>Saldo Deposit:</span>
                          <span className="text-emerald-600 dark:text-emerald-400 font-mono">
                            Rp {Number(item.balance).toLocaleString('id-ID')}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleTestSingle(item.id)}
                    disabled={isSingleLoading || loadingAll}
                    className="h-7 px-2 text-xs shrink-0 hover:bg-muted"
                  >
                    {isSingleLoading ? <Loader2 className="size-3.5 animate-spin" /> : 'Uji Ulang'}
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      </DialogContent>
    </Dialog>
  )
}
