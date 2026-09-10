import { useQuery } from '@tanstack/react-query'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@umbreon/ui/components/ui/dialog'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@umbreon/ui/components/ui/sheet'
import {
  ArrowRight,
  Gamepad2,
  ReceiptText,
  Search,
  Smartphone,
  Sparkles,
  TicketPercent,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { useWindowSize } from 'usehooks-ts'
import { apiClient } from '~/utils/axios'
import Image from '../image'

export interface QuickCategoryItem {
  id: string
  name: string
  slug: string
  image_url: string
  publisher?: string
  label?: string
  is_featured?: boolean
  type?: string
}

interface CategoryGroup {
  key: 'pulsa' | 'ppob' | 'game' | 'voucher'
  title: string
  description: string
  icon: typeof Smartphone
  badge?: string
}

const CATEGORY_TABS: CategoryGroup[] = [
  {
    key: 'pulsa',
    title: 'Pulsa',
    description: 'Isi ulang pulsa & paket data semua operator dengan instan.',
    icon: Smartphone,
  },
  {
    key: 'ppob',
    title: 'PPOB',
    description: 'Bayar tagihan PLN, PDAM, BPJS, Internet & layanan lainnya.',
    icon: ReceiptText,
  },
  {
    key: 'game',
    title: 'Top Up',
    description: 'Top up diamond, cash, dan koin game favorit terlengkap & termurah.',
    icon: Gamepad2,
    badge: 'Populer',
  },
  {
    key: 'voucher',
    title: 'Voucher',
    description: 'Beli gift card Google Play, Steam, voucher diskon & hiburan.',
    icon: TicketPercent,
  },
]

export default function QuickCategoryDock() {
  const { width } = useWindowSize()
  const [selectedKey, setSelectedKey] = useState<CategoryGroup['key'] | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const isMobile = useMemo(() => (width ? width < 768 : true), [width])

  // Fetch all products grouped
  const productsQuery = useQuery({
    queryKey: ['home-all-products'],
    queryFn: () =>
      apiClient
        .get('/home/products')
        .then((res) => res.data?.data || [])
        .catch(() => []),
    staleTime: 60_000,
  })

  // Filter items matching active category
  const activeGroup = useMemo(
    () => CATEGORY_TABS.find((tab) => tab.key === selectedKey),
    [selectedKey],
  )

  const activeItems = useMemo(() => {
    if (!selectedKey || !productsQuery.data) return []

    const allData = productsQuery.data as Array<{ type: string; items: QuickCategoryItem[] }>
    let filtered: QuickCategoryItem[] = []

    if (selectedKey === 'pulsa') {
      const pulsaGroup = allData.find((g) => g.type === 'pulsa' || g.type === 'kuota')
      filtered = pulsaGroup?.items || []
    } else if (selectedKey === 'ppob') {
      const ppobGroup = allData.find(
        (g) =>
          g.type === 'billing' ||
          g.type === 'ppob' ||
          g.type === 'finance' ||
          g.type === 'ecommerce',
      )
      filtered = ppobGroup?.items || []
    } else if (selectedKey === 'game') {
      const gameGroup = allData.find((g) => g.type === 'game' || g.type === 'topup')
      filtered = gameGroup?.items || []
    } else if (selectedKey === 'voucher') {
      const voucherGroup = allData.find((g) => g.type === 'voucher' || g.type === 'entertainment')
      filtered = voucherGroup?.items || []
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (item) =>
          item.name.toLowerCase().includes(q) ||
          (item.publisher && item.publisher.toLowerCase().includes(q)),
      )
    }

    return filtered
  }, [selectedKey, productsQuery.data, searchQuery])

  const handleOpenCategory = (key: CategoryGroup['key']) => {
    setSelectedKey(key)
    setSearchQuery('')
  }

  const handleClose = () => {
    setSelectedKey(null)
    setSearchQuery('')
  }

  return (
    <section
      className="my-2.5 sm:my-3.5 select-none max-w-md md:max-w-lg mx-auto"
      aria-label="Quick Category Menu"
    >
      {/* Compact Dock Container */}
      <div className="rounded-2xl sm:rounded-[24px] bg-card/85 backdrop-blur-xl border border-border/80 p-2 sm:p-2.5 shadow-xs dark:shadow-[0_8px_24px_rgba(0,0,0,0.35)] transition-colors">
        <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
          {CATEGORY_TABS.map((tab) => {
            const Icon = tab.icon
            const isSelected = selectedKey === tab.key

            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => handleOpenCategory(tab.key)}
                className={`group relative flex flex-col items-center justify-center py-2 sm:py-2.5 px-1 rounded-xl sm:rounded-2xl transition-all duration-200 cursor-pointer active:scale-95 ${
                  isSelected
                    ? 'bg-secondary border border-border shadow-xs scale-[0.98]'
                    : 'bg-secondary/40 hover:bg-secondary/80 border border-border/40 hover:border-border/70'
                }`}
                title={tab.title}
              >
                {/* Optional hot badge for Top Up */}
                {tab.badge && (
                  <span className="absolute -top-1 -right-0.5 px-1.5 py-0.2 text-[8px] font-bold text-white bg-gradient-to-r from-red-500 to-amber-500 rounded-full shadow-xs pointer-events-none">
                    {tab.badge}
                  </span>
                )}

                {/* Center Icon */}
                <div className="flex items-center justify-center h-5 sm:h-6 mb-1">
                  <Icon
                    className={`size-[18px] sm:size-5 transition-transform duration-200 group-hover:scale-110 ${
                      isSelected
                        ? 'text-primary dark:text-foreground stroke-[2.2]'
                        : 'text-foreground/80 group-hover:text-foreground stroke-[1.8]'
                    }`}
                  />
                </div>

                {/* Label */}
                <span
                  className={`text-[10px] sm:text-[11px] font-medium tracking-tight text-center leading-tight transition-colors ${
                    isSelected
                      ? 'text-primary dark:text-foreground font-semibold'
                      : 'text-muted-foreground group-hover:text-foreground'
                  }`}
                >
                  {tab.title}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Sheet Content for Mobile Devices */}
      {isMobile ? (
        <Sheet open={!!selectedKey} onOpenChange={(open) => !open && handleClose()}>
          <SheetContent
            side="bottom"
            className="max-h-[82vh] overflow-y-auto rounded-t-[32px] bg-card text-card-foreground border-border p-5"
          >
            <SheetHeader className="text-left pb-3 border-b border-border">
              <div className="flex items-center gap-2.5">
                {activeGroup && (
                  <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-md">
                    <activeGroup.icon className="size-5 text-primary-foreground stroke-[2]" />
                  </div>
                )}
                <div>
                  <SheetTitle className="text-lg font-bold text-foreground tracking-tight">
                    {activeGroup?.title}
                  </SheetTitle>
                  <SheetDescription className="text-xs text-muted-foreground">
                    {activeGroup?.description}
                  </SheetDescription>
                </div>
              </div>

              {/* Search filter in modal */}
              <div className="relative mt-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={`Cari produk ${activeGroup?.title.toLowerCase()}...`}
                  className="w-full bg-secondary/70 border border-border rounded-xl py-2 pl-9 pr-3 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:border-primary transition-colors"
                />
              </div>
            </SheetHeader>

            {/* Product items grid */}
            <div className="mt-4 grid grid-cols-2 gap-2.5">
              {activeItems.length > 0 ? (
                activeItems.map((item) => (
                  <Link
                    key={item.id || item.slug}
                    to={`/order/${item.slug}`}
                    onClick={handleClose}
                    className="flex items-center gap-2.5 p-2.5 rounded-2xl bg-secondary/40 hover:bg-secondary border border-border/50 hover:border-border transition-all active:scale-95 group"
                  >
                    <Image
                      src={item.image_url}
                      alt={item.name}
                      className="size-11 rounded-xl object-cover shrink-0 border border-border"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-foreground group-hover:text-primary line-clamp-1">
                        {item.name}
                      </p>
                      {item.publisher && (
                        <p className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5">
                          {item.publisher}
                        </p>
                      )}
                    </div>
                  </Link>
                ))
              ) : (
                <div className="col-span-2 py-8 text-center text-xs text-muted-foreground">
                  {searchQuery ? 'Produk tidak ditemukan.' : 'Memuat produk...'}
                </div>
              )}
            </div>

            {/* Bottom link to view all */}
            <div className="mt-4 pt-3 border-t border-border flex justify-between items-center text-xs">
              <span className="text-muted-foreground">Pilihan terlengkap di katalog</span>
              <Link
                to="/price-list"
                onClick={handleClose}
                className="inline-flex items-center gap-1 text-primary hover:underline font-medium"
              >
                Lihat Daftar Harga <ArrowRight className="size-3.5" />
              </Link>
            </div>
          </SheetContent>
        </Sheet>
      ) : (
        /* Dialog Content for Desktop */
        <Dialog open={!!selectedKey} onOpenChange={(open) => !open && handleClose()}>
          <DialogContent className="max-w-xl bg-card text-card-foreground border-border p-6 rounded-3xl">
            <DialogHeader className="text-left pb-3 border-b border-border">
              <div className="flex items-center gap-3">
                {activeGroup && (
                  <div className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center shadow-md">
                    <activeGroup.icon className="size-5 text-primary-foreground stroke-[2]" />
                  </div>
                )}
                <div>
                  <DialogTitle className="text-xl font-bold text-foreground tracking-tight">
                    {activeGroup?.title}
                  </DialogTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">{activeGroup?.description}</p>
                </div>
              </div>

              {/* Search Bar */}
              <div className="relative mt-4">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={`Cari produk ${activeGroup?.title.toLowerCase()}...`}
                  className="w-full bg-secondary/70 border border-border rounded-xl py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary transition-colors"
                />
              </div>
            </DialogHeader>

            {/* Grid */}
            <div className="max-h-[55vh] overflow-y-auto pr-1 grid grid-cols-2 sm:grid-cols-3 gap-3 mt-3">
              {activeItems.length > 0 ? (
                activeItems.map((item) => (
                  <Link
                    key={item.id || item.slug}
                    to={`/order/${item.slug}`}
                    onClick={handleClose}
                    className="flex items-center gap-3 p-3 rounded-2xl bg-secondary/40 hover:bg-secondary border border-border/50 hover:border-border transition-all group"
                  >
                    <Image
                      src={item.image_url}
                      alt={item.name}
                      className="size-11 rounded-xl object-cover shrink-0 border border-border"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-foreground group-hover:text-primary line-clamp-1">
                        {item.name}
                      </p>
                      {item.publisher && (
                        <p className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5">
                          {item.publisher}
                        </p>
                      )}
                    </div>
                  </Link>
                ))
              ) : (
                <div className="col-span-full py-10 text-center text-sm text-muted-foreground">
                  {searchQuery ? 'Produk tidak ditemukan.' : 'Tidak ada produk di kategori ini.'}
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-border flex justify-between items-center text-xs">
              <span className="text-muted-foreground flex items-center gap-1">
                <Sparkles className="size-3.5 text-amber-500" /> Transaksi otomatis 24 jam non-stop
              </span>
              <Link
                to="/price-list"
                onClick={handleClose}
                className="inline-flex items-center gap-1 text-primary hover:underline font-semibold"
              >
                Lihat Semua Harga <ArrowRight className="size-3.5" />
              </Link>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </section>
  )
}
