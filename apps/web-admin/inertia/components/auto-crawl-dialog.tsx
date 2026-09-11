import { router } from '@inertiajs/react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Button } from '@umbreon/ui/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@umbreon/ui/components/ui/dialog'
import { Input } from '@umbreon/ui/components/ui/input'
import { Label } from '@umbreon/ui/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@umbreon/ui/components/ui/select'
import {
  CheckCircle2,
  ChevronRight,
  Flame,
  Gamepad2,
  Loader2,
  RefreshCw,
  Sparkles,
  Zap,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { formatPrice } from '~/utils'
import { apiClient } from '~/utils/axios'

interface AutoCrawlDialogProps {
  initialBrand?: string
  targetCategoryId?: string
  triggerText?: string
  variant?: 'default' | 'outline' | 'secondary'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  className?: string
}

interface BrandItem {
  brand: string
  category: string
  count: number
}

interface AutoCrawlResult {
  success: boolean
  totalFetched: number
  totalProcessed: number
  categoriesCreated: number
  categoriesUpdated: number
  subCategoriesCreated: number
  productsCreated: number
  productsUpdated: number
  brandsProcessed: string[]
  message: string
}

export function AutoCrawlDialog({
  initialBrand = '',
  targetCategoryId,
  triggerText = '⚡ Auto Crawl Digiflazz',
  variant = 'default',
  size = 'sm',
  className = '',
}: AutoCrawlDialogProps) {
  const [open, setOpen] = useState(false)
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [selectedBrand, setSelectedBrand] = useState<string>(initialBrand)
  const [profitStatic, setProfitStatic] = useState<number>(500)
  const [profitPercentage, setProfitPercentage] = useState<number>(0)
  const [result, setResult] = useState<AutoCrawlResult | null>(null)

  // Status & Saldo Digiflazz
  const saldoQuery = useQuery({
    queryKey: ['digiflazz-saldo'],
    queryFn: async () => {
      const res = await apiClient.get('/admin/providers/digiflazz/saldo')
      return res.data
    },
    enabled: open,
    staleTime: 60 * 1000,
  })

  // Daftar Brand dari Digiflazz
  const brandsQuery = useQuery<{ success: boolean; brands: BrandItem[] }>({
    queryKey: ['digiflazz-brands', categoryFilter],
    queryFn: async () => {
      const res = await apiClient.get('/admin/providers/digiflazz/brands', {
        params: { categoryFilter },
      })
      return res.data
    },
    enabled: open,
    staleTime: 60 * 1000,
  })

  const availableBrands = brandsQuery.data?.brands || []

  // Mutasi eksekusi auto-crawl
  const crawlMutation = useMutation<AutoCrawlResult, Error, void>({
    mutationFn: async () => {
      const res = await apiClient.post('/admin/providers/digiflazz/auto-crawl', {
        categoryFilter: categoryFilter === 'all' ? undefined : categoryFilter,
        brandFilter: selectedBrand && selectedBrand !== 'ALL_BRANDS' ? selectedBrand : undefined,
        profitStatic: Number(profitStatic) || 0,
        profitPercentage: Number(profitPercentage) || 0,
        targetCategoryId: targetCategoryId || undefined,
      })
      return res.data
    },
    onSuccess: (data) => {
      setResult(data)
      toast.success(
        `Sukses! ${data.productsCreated} produk dibuat, ${data.productsUpdated} diperbarui.`,
      )
    },
    onError: (error: any) => {
      const msg = error.response?.data?.error || error.message || 'Gagal melakukan auto crawl'
      toast.error(msg)
    },
  })

  const sampleOriginal = 20000
  const sampleSelling = useMemo(() => {
    return Math.round(
      sampleOriginal +
        Number(profitStatic || 0) +
        (sampleOriginal * Number(profitPercentage || 0)) / 100,
    )
  }, [profitStatic, profitPercentage])

  const handleApplyAndClose = () => {
    setOpen(false)
    router.reload()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size={size} variant={variant} className={`gap-1.5 font-semibold ${className}`}>
          <Zap className="size-4 text-amber-500 fill-amber-500" />
          {triggerText}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500 border border-amber-500/20">
              <Sparkles className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold">
                Auto-Crawl & Katalog Otomatis Digiflazz
              </DialogTitle>
              <DialogDescription className="text-xs">
                Tarik otomatis seluruh game, pulsa, data, dan voucher langsung dari Digiflazz H2H.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Status Saldo & Koneksi Digiflazz */}
        <div className="rounded-lg border border-border/80 bg-muted/40 p-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span
              className={`size-2.5 rounded-full ${
                saldoQuery.data?.connected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'
              }`}
            />
            <div>
              <p className="text-xs font-semibold text-foreground">
                Digiflazz H2H: {saldoQuery.data?.connected ? 'Terhubung' : 'Memeriksa...'}
              </p>
              <p className="text-[11px] text-muted-foreground">
                Saldo Akun:{' '}
                <strong className="text-emerald-600 dark:text-emerald-400">
                  {saldoQuery.data?.saldo ? formatPrice(saldoQuery.data.saldo) : 'Rp 0'}
                </strong>
              </p>
            </div>
          </div>
          <Button
            size="icon"
            variant="ghost"
            className="size-7"
            onClick={() => saldoQuery.refetch()}
            disabled={saldoQuery.isFetching}
          >
            <RefreshCw className={`size-3.5 ${saldoQuery.isFetching ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {/* Hasil Sukses */}
        {result && (
          <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-4 space-y-3">
            <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300 font-semibold text-sm">
              <CheckCircle2 className="size-5 shrink-0" />
              <span>{result.message}</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-center">
              <div className="bg-background/80 rounded-lg p-2 border border-emerald-500/20">
                <p className="text-lg font-bold text-foreground">{result.categoriesCreated}</p>
                <p className="text-[10px] text-muted-foreground">Kategori Dibuat</p>
              </div>
              <div className="bg-background/80 rounded-lg p-2 border border-emerald-500/20">
                <p className="text-lg font-bold text-foreground">{result.subCategoriesCreated}</p>
                <p className="text-[10px] text-muted-foreground">Sub-Kategori</p>
              </div>
              <div className="bg-background/80 rounded-lg p-2 border border-emerald-500/20">
                <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                  +{result.productsCreated}
                </p>
                <p className="text-[10px] text-muted-foreground">Produk Baru</p>
              </div>
              <div className="bg-background/80 rounded-lg p-2 border border-emerald-500/20">
                <p className="text-lg font-bold text-foreground">{result.productsUpdated}</p>
                <p className="text-[10px] text-muted-foreground">Diperbarui</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Brand terproses: {result.brandsProcessed.slice(0, 8).join(', ')}
              {result.brandsProcessed.length > 8
                ? ` dan ${result.brandsProcessed.length - 8} lainnya.`
                : '.'}
            </p>
            <Button size="sm" className="w-full mt-2" onClick={handleApplyAndClose}>
              Selesai & Refresh Halaman
            </Button>
          </div>
        )}

        {!result && (
          <div className="space-y-4">
            {/* Filter Kategori */}
            <div>
              <Label className="text-xs font-semibold mb-1.5 block">
                1. Pilih Kategori Digiflazz
              </Label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full text-xs">
                  <SelectValue placeholder="Pilih Kategori" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    🚀 Semua Kategori (Games, Pulsa, Data, E-Wallet, PLN)
                  </SelectItem>
                  <SelectItem value="games">
                    🎮 Games (Mobile Legends, FF, Genshin, PUBG, dll)
                  </SelectItem>
                  <SelectItem value="pulsa">
                    📱 Pulsa (Telkomsel, Indosat, XL, Tri, Axis, Smartfren)
                  </SelectItem>
                  <SelectItem value="data">🌐 Kuota & Paket Data</SelectItem>
                  <SelectItem value="e-money">
                    💳 E-Money & E-Wallet (DANA, GoPay, OVO, ShopeePay)
                  </SelectItem>
                  <SelectItem value="pln">⚡ Token PLN Listrik</SelectItem>
                  <SelectItem value="voucher">🎟️ Voucher Digital & Gift Cards</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Filter Brand Spesifik */}
            <div>
              <Label className="text-xs font-semibold mb-1.5 block">
                2. Pilih Brand / Layanan (Opsional)
              </Label>
              <Select
                value={selectedBrand || 'ALL_BRANDS'}
                onValueChange={(val) => setSelectedBrand(val === 'ALL_BRANDS' ? '' : val)}
              >
                <SelectTrigger className="w-full text-xs">
                  <SelectValue placeholder="Semua Brand dalam Kategori ini" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  <SelectItem value="ALL_BRANDS">🌟 Semua Brand Sekaligus (Rekomendasi)</SelectItem>
                  {availableBrands.map((b) => (
                    <SelectItem key={b.brand} value={b.brand}>
                      {b.brand} ({b.count} SKU produk)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[11px] text-muted-foreground mt-1">
                Pilih brand tertentu jika Anda hanya ingin membuat 1 game/operator (misal:{' '}
                <em>MOBILE LEGENDS</em> atau <em>GARENA</em>).
              </p>
            </div>

            {/* Margin Keuntungan */}
            <div className="space-y-2 rounded-xl border border-border p-3.5 bg-muted/20">
              <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                <Flame className="size-4 text-orange-500" />
                <span>3. Pengaturan Margin Keuntungan Default</span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Harga jual ke member akan otomatis dihitung dari harga modal Digiflazz + margin ini
                (dapat diubah kapan saja per produk).
              </p>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <Label className="text-[11px] font-medium" htmlFor="crawl-profit-static">
                    Margin Nominal (Rp)
                  </Label>
                  <Input
                    id="crawl-profit-static"
                    type="number"
                    min={0}
                    value={profitStatic}
                    onChange={(e) => setProfitStatic(Number(e.target.value) || 0)}
                    placeholder="500"
                    className="h-8 text-xs"
                  />
                </div>
                <div>
                  <Label className="text-[11px] font-medium" htmlFor="crawl-profit-pct">
                    Margin Persentase (%)
                  </Label>
                  <Input
                    id="crawl-profit-pct"
                    type="number"
                    min={0}
                    max={100}
                    value={profitPercentage}
                    onChange={(e) => setProfitPercentage(Number(e.target.value) || 0)}
                    placeholder="0"
                    className="h-8 text-xs"
                  />
                </div>
              </div>

              {/* Preview Kalkulasi */}
              <div className="rounded-lg bg-background p-2.5 border border-border/80 flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Contoh Modal Rp 20.000:</span>
                <div className="flex items-center gap-1.5 font-bold">
                  <span className="line-through text-muted-foreground">Rp 20.000</span>
                  <ChevronRight className="size-3 text-muted-foreground" />
                  <span className="text-primary">{formatPrice(sampleSelling)}</span>
                  <span className="text-[10px] text-emerald-600 bg-emerald-500/10 px-1 rounded">
                    +Rp {sampleSelling - sampleOriginal}
                  </span>
                </div>
              </div>
            </div>

            {/* Fitur Otomatisasi yang Disertakan */}
            <div className="rounded-lg border border-dashed border-primary/40 bg-primary/5 p-3 text-xs space-y-1.5">
              <p className="font-semibold text-primary flex items-center gap-1.5">
                <Gamepad2 className="size-4" /> Apa saja yang otomatis dibuat oleh sistem?
              </p>
              <ul className="text-muted-foreground space-y-1 list-disc list-inside text-[11px]">
                <li>
                  <strong>Kategori Game/Produk</strong> lengkap dengan nama, icon/banner, dan
                  publisher resmi.
                </li>
                <li>
                  <strong>Input Field</strong> (User ID & Zone ID untuk game, No. HP untuk
                  Pulsa/E-Wallet).
                </li>
                <li>
                  <strong>Sub-Kategori</strong> (Diamonds, Reguler, Voucher) langsung aktif.
                </li>
                <li>
                  <strong>Seluruh Produk & SKU</strong> dengan harga modal, harga jual, dan stok
                  otomatis.
                </li>
              </ul>
            </div>
          </div>
        )}

        <DialogFooter className="gap-2 pt-2">
          <DialogClose asChild>
            <Button variant="secondary" disabled={crawlMutation.isPending}>
              Tutup
            </Button>
          </DialogClose>
          {!result && (
            <Button
              className="gap-2 font-bold"
              disabled={crawlMutation.isPending}
              onClick={() => crawlMutation.mutate()}
            >
              {crawlMutation.isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Sedang Meng-crawl & Menata Katalog...
                </>
              ) : (
                <>
                  <Zap className="size-4 fill-current" />
                  Mulai Auto-Crawl Sekarang
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
