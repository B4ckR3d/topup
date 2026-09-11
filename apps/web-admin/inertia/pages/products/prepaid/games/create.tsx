import { useForm } from '@inertiajs/react'
import { ProductBillingType, ProductCategoryType, ProductFullfillmentType } from '@umbreon/db/types'
import { Button } from '@umbreon/ui/components/ui/button'
import { Input } from '@umbreon/ui/components/ui/input'
import { Label } from '@umbreon/ui/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@umbreon/ui/components/ui/select'
import { Switch } from '@umbreon/ui/components/ui/switch'
import { Textarea } from '@umbreon/ui/components/ui/textarea'
import toast from 'react-hot-toast'
import type { CreateProductCategoryValidator } from '#validators/product'
import FileManager from '~/components/file-manager'
import AdminLayout from '~/components/layout/admin-layout'

type GamePreset = {
  label: string
  name: string
  sub_name: string
  publisher: string
  description: string
  label_tag: string
  seo_title: string
  seo_description: string
}

const GAME_PRESETS: GamePreset[] = [
  {
    label: '⚡ Mobile Legends: Bang Bang (Moonton)',
    name: 'Mobile Legends: Bang Bang',
    sub_name: 'Diamonds & Weekly Diamond Pass',
    publisher: 'Moonton',
    description:
      'Top up Diamond Mobile Legends resmi dan terpercaya. Proses instan 24 jam dengan metode pembayaran terlengkap.',
    label_tag: 'HOT',
    seo_title: 'Top Up Mobile Legends Murah & Cepat - Umbreon Store',
    seo_description:
      'Beli diamond Mobile Legends resmi terpercaya. Proses instan 24 jam dengan pembayaran QRIS, E-Wallet, dan Virtual Account.',
  },
  {
    label: '⚡ Free Fire (Garena)',
    name: 'Free Fire',
    sub_name: 'Diamonds & Membership',
    publisher: 'Garena',
    description:
      'Top up Diamond Free Fire resmi termurah. Proses pengisian cepat dan otomatis 24 jam.',
    label_tag: 'POPULAR',
    seo_title: 'Top Up Free Fire Murah & Cepat - Umbreon Store',
    seo_description: 'Beli diamond Free Fire resmi murah, cepat, dan aman hanya di Umbreon Store.',
  },
  {
    label: '⚡ PUBG Mobile (Tencent Games)',
    name: 'PUBG Mobile',
    sub_name: 'Unknown Cash (UC)',
    publisher: 'Tencent Games',
    description: 'Top up UC PUBG Mobile resmi. Proses otomatis masuk ke akun dalam hitungan detik.',
    label_tag: 'BEST SELLER',
    seo_title: 'Top Up UC PUBG Mobile Murah & Resmi - Umbreon Store',
    seo_description: 'Top up UC PUBG Mobile termurah dan instan 24 jam di Umbreon Store.',
  },
  {
    label: '⚡ Genshin Impact (HoYoverse)',
    name: 'Genshin Impact',
    sub_name: 'Genesis Crystals & Welkin Moon',
    publisher: 'HoYoverse',
    description:
      'Top up Genesis Crystals & Blessing of the Welkin Moon Genshin Impact resmi via UID.',
    label_tag: 'RESMI',
    seo_title: 'Top Up Genshin Impact Genesis Crystals - Umbreon Store',
    seo_description: 'Beli Genesis Crystals Genshin Impact murah via UID resmi 24 jam.',
  },
  {
    label: '⚡ Honor of Kings (Level Infinite)',
    name: 'Honor of Kings',
    sub_name: 'Tokens & Weekly Pass',
    publisher: 'Level Infinite',
    description: 'Top up Tokens Honor of Kings resmi, cepat dan terpercaya.',
    label_tag: 'NEW',
    seo_title: 'Top Up Honor of Kings Tokens Murah - Umbreon Store',
    seo_description: 'Top up Tokens Honor of Kings instan 24 jam di Umbreon Store.',
  },
  {
    label: '⚡ Valorant (Riot Games)',
    name: 'Valorant',
    sub_name: 'Valorant Points (VP)',
    publisher: 'Riot Games',
    description: 'Top up Points Valorant resmi Riot Games untuk beli Battle Pass dan Skin.',
    label_tag: 'HOT',
    seo_title: 'Top Up Valorant Points (VP) Murah - Umbreon Store',
    seo_description: 'Beli Valorant Points (VP) resmi dan instan hanya di Umbreon Store.',
  },
  {
    label: '⚡ Honkai: Star Rail (HoYoverse)',
    name: 'Honkai: Star Rail',
    sub_name: 'Oneiric Shards & Express Supply Pass',
    publisher: 'HoYoverse',
    description: 'Top up Oneiric Shards & Express Supply Pass Honkai: Star Rail resmi via UID.',
    label_tag: 'RESMI',
    seo_title: 'Top Up Honkai Star Rail Murah - Umbreon Store',
    seo_description: 'Top up Oneiric Shards Honkai Star Rail resmi instan 24 jam.',
  },
  {
    label: '⚡ Roblox (Roblox Corporation)',
    name: 'Roblox',
    sub_name: 'Robux & Gift Card',
    publisher: 'Roblox Corporation',
    description: 'Beli Robux Roblox resmi dan instan dengan harga termurah.',
    label_tag: 'POPULAR',
    seo_title: 'Beli Robux Roblox Murah & Instan - Umbreon Store',
    seo_description: 'Beli Robux resmi dan terpercaya untuk game Roblox.',
  },
  {
    label: '⚡ Call of Duty Mobile (Garena)',
    name: 'Call of Duty Mobile',
    sub_name: 'CP Points',
    publisher: 'Garena',
    description: 'Top up CP CODM resmi Garena langsung masuk ke akun game.',
    label_tag: 'PROMO',
    seo_title: 'Top Up CP CODM Murah - Umbreon Store',
    seo_description: 'Beli CP Call of Duty Mobile resmi dan terpercaya.',
  },
  {
    label: '⚡ Point Blank (Zepetto)',
    name: 'Point Blank',
    sub_name: 'PB Cash',
    publisher: 'Zepetto',
    description: 'Top up PB Cash Point Blank resmi Zepetto untuk beli senjata dan item favorit.',
    label_tag: 'PROMO',
    seo_title: 'Top Up PB Cash Point Blank Murah - Umbreon Store',
    seo_description: 'Beli PB Cash Zepetto resmi instan 24 jam.',
  },
]

export default function CreateProductCategory() {
  const { data, errors, setData, post, processing } = useForm<CreateProductCategoryValidator>(
    'createGame',
    {
      file_image_id: 'cffe1506-4a45-4ee5-aa7d-eb69748192a9',
      file_icon_id: '',
      file_banner_id: '',
      name: '',
      sub_name: '',
      description: '',
      publisher: '',
      is_available: true,
      is_featured: false,
      label: '',
      delivery_type: 'instant',
      is_seo_enabled: false,
      seo_title: '',
      seo_description: '',
      seo_image_id: '',
      product_billing_type: ProductBillingType.PREPAID,
      type: ProductCategoryType.GAME,
      product_fullfillment_type: ProductFullfillmentType.AUTOMATIC_DIRECT,
      is_special_feature: false,
      special_feature_key: '',
      tags1: [],
      tags2: [],
    },
  )

  const applyGamePreset = (preset: GamePreset) => {
    setData((prev) => ({
      ...prev,
      name: preset.name,
      sub_name: preset.sub_name,
      publisher: preset.publisher,
      description: preset.description,
      label: preset.label_tag,
      is_seo_enabled: true,
      seo_title: preset.seo_title,
      seo_description: preset.seo_description,
    }))
    toast.success(`Data game ${preset.name} berhasil diisi otomatis!`)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    post('/admin/product-categories/game/create', {
      onSuccess: () => {
        toast.success('Product category created successfully!')
      },
      onError: (errors) => {
        Object.keys(errors).forEach((key) => {
          toast.error(errors[key])
        })
      },
    })
  }

  return (
    <AdminLayout>
      <h2 className="mt-4 text-2xl font-semibold text-foreground">Create Product Category</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Lengkapi data kategori game untuk publikasi ke storefront pelanggan.
      </p>

      {/* Auto-Fill Game & H2H Flow Guidance */}
      <div className="mt-6 rounded-xl border border-primary/25 bg-primary/5 p-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
              <span>⚡ Quick Grab / Auto-Fill Game dari Provider</span>
            </h3>
            <p className="text-xs text-muted-foreground">
              Pilih game untuk mengisi Nama, Sub Name, Publisher, Deskripsi & SEO secara otomatis
              tanpa ketik manual.
            </p>
          </div>
        </div>

        <Select
          onValueChange={(val) => {
            const preset = GAME_PRESETS.find((p) => p.name === val)
            if (preset) applyGamePreset(preset)
          }}
        >
          <SelectTrigger className="w-full bg-background text-xs h-9">
            <SelectValue placeholder="Pilih Game (Mobile Legends, Free Fire, Genshin, Valorant, dll)..." />
          </SelectTrigger>
          <SelectContent>
            {GAME_PRESETS.map((p) => (
              <SelectItem key={p.name} value={p.name} className="text-xs">
                {p.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="rounded-lg bg-blue-500/10 border border-blue-500/20 p-2.5 text-xs text-blue-700 dark:text-blue-300 space-y-1">
          <p className="font-semibold flex items-center gap-1">
            <span>ℹ️ Cara Menambahkan Produk/Item H2H Otomatis:</span>
          </p>
          <p>
            Form di halaman ini adalah untuk membuat <strong>Wadah Kategori Game</strong>. Setelah
            menyimpan kategori ini:
          </p>
          <ol className="list-decimal list-inside space-y-0.5 pl-1 text-[11px] opacity-90">
            <li>
              Masuk ke <strong>Detail Kategori</strong> &rarr; Buat <strong>Sub-Kategori</strong>{' '}
              (contoh: <em>Diamonds</em>).
            </li>
            <li>
              Di dalam Sub-Kategori, klik tombol awan <strong>"Add from Provider"</strong>.
            </li>
            <li>
              Pilih provider (<strong>Digiflazz / VIP-Reseller</strong>), tentukan margin
              keuntungan, dan centang produk untuk diimpor otomatis secara massal!
            </li>
          </ol>
        </div>
      </div>

      <form
        className="mt-6 grid w-full max-w-6xl grid-cols-1 gap-5 md:grid-cols-2"
        onSubmit={handleSubmit}
      >
        <div className="md:col-span-2 border-b border-border pb-2">
          <p className="text-sm font-semibold text-foreground">Section: Media</p>
          <p className="text-xs text-muted-foreground">Upload image, icon, dan banner produk.</p>
        </div>
        {/* File Image */}
        <div>
          <Label htmlFor="file_image_id" className="mb-2">
            Image (Large)
          </Label>
          <div className="mt-2 flex items-center gap-2">
            <FileManager onFilesSelected={(file) => setData('file_image_id', file.id)} />
          </div>
          {errors.file_image_id && (
            <p className="mt-1 text-xs text-rose-600">{errors.file_image_id}</p>
          )}
        </div>
        {/* File Icon */}
        <div>
          <Label htmlFor="file_icon_id" className="mb-2">
            Image (Icon APK)
          </Label>
          <div className="mt-2 flex items-center gap-2">
            <FileManager onFilesSelected={(file) => setData('file_icon_id', file.id)} />
          </div>
          {errors.file_icon_id && (
            <p className="mt-1 text-xs text-rose-600">{errors.file_icon_id}</p>
          )}
        </div>

        {/* File Banner */}
        <div>
          <Label htmlFor="file_banner_id" className="mb-2">
            Banner
          </Label>
          <div className="mt-2 flex items-center gap-2">
            <FileManager onFilesSelected={(file) => setData('file_banner_id', file.id)} />
          </div>
          {errors.file_banner_id && (
            <p className="mt-1 text-xs text-rose-600">{errors.file_banner_id}</p>
          )}
        </div>

        <div className="md:col-span-2 border-b border-border pb-2 pt-1">
          <p className="text-sm font-semibold text-foreground">Section: Product Info</p>
          <p className="text-xs text-muted-foreground">Informasi utama produk untuk pengguna.</p>
        </div>
        {/* Name */}
        <div>
          <Label htmlFor="name" className="mb-2">
            Name
          </Label>
          <Input id="name" value={data.name} onChange={(e) => setData('name', e.target.value)} />
          {errors.name && <p className="mt-1 text-xs text-rose-600">{errors.name}</p>}
        </div>

        {/* Sub Name */}
        <div>
          <Label htmlFor="sub_name" className="mb-2">
            Sub Name
          </Label>
          <Input
            id="sub_name"
            value={data.sub_name || ''}
            onChange={(e) => setData('sub_name', e.target.value)}
          />
          {errors.sub_name && <p className="mt-1 text-xs text-rose-600">{errors.sub_name}</p>}
        </div>

        {/* Description */}
        <div>
          <Label htmlFor="description" className="mb-2">
            Description
          </Label>
          <Textarea
            className="min-h-24"
            id="description"
            value={data.description}
            onChange={(e) => setData('description', e.target.value)}
          />
          {errors.description && <p className="mt-1 text-xs text-rose-600">{errors.description}</p>}
        </div>

        {/* Publisher */}
        <div>
          <Label htmlFor="publisher" className="mb-2">
            Publisher
          </Label>
          <Input
            id="publisher"
            value={data.publisher}
            onChange={(e) => setData('publisher', e.target.value)}
          />
          {errors.publisher && <p className="mt-1 text-xs text-rose-600">{errors.publisher}</p>}
        </div>

        <div className="md:col-span-2 border-b border-border pb-2 pt-1">
          <p className="text-sm font-semibold text-foreground">Section: Visibility</p>
          <p className="text-xs text-muted-foreground">
            Kontrol status tampil dan penandaan produk.
          </p>
        </div>
        {/* Is Active */}
        <div className="flex items-center gap-2">
          <Switch
            id="is_active"
            checked={data.is_available}
            onCheckedChange={(val) => setData('is_available', val)}
          />
          <Label htmlFor="is_active" className="mb-2">
            Active
          </Label>
        </div>
        {errors.is_available && <p className="mt-1 text-xs text-rose-600">{errors.is_available}</p>}

        {/* Is Featured */}
        <div className="flex items-center gap-2">
          <Switch
            id="is_featured"
            checked={data.is_featured}
            onCheckedChange={(val) => setData('is_featured', val)}
          />
          <Label htmlFor="is_featured" className="mb-2">
            Featured
          </Label>
        </div>
        {errors.is_featured && <p className="mt-1 text-xs text-rose-600">{errors.is_featured}</p>}

        {/* Label */}
        <div>
          <Label htmlFor="label" className="mb-2">
            Label
          </Label>
          <Input
            id="label"
            value={data.label || ''}
            onChange={(e) => setData('label', e.target.value)}
          />
          {errors.label && <p className="mt-1 text-xs text-rose-600">{errors.label}</p>}
        </div>

        {/* Delivery Type */}
        <div>
          <Label htmlFor="delivery_type" className="mb-2">
            Delivery Type
          </Label>
          <Select
            value={data.delivery_type}
            onValueChange={(val) => setData('delivery_type', val as any)}
          >
            <SelectTrigger id="delivery_type">
              <SelectValue placeholder="Select delivery type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="instant">Instant</SelectItem>
              <SelectItem value="manual">Manual</SelectItem>
            </SelectContent>
          </Select>
          {errors.delivery_type && (
            <p className="mt-1 text-xs text-rose-600">{errors.delivery_type}</p>
          )}
        </div>
        {/* Billing & Fullfilment Type */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* <div>
            <Label htmlFor="billing_type" className="mb-2">
              Billing Type
            </Label>
            <Select
              value={data.product_billing_type}
              onValueChange={(val) => setData('product_billing_type', val as any)}
            >
              <SelectTrigger id="product_billing_type">
                <SelectValue placeholder="Select billing type" />
              </SelectTrigger>
              <SelectContent>
                {Object.values(ProductBillingType).map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.product_billing_type && (
              <p className="mt-1 text-xs text-rose-600">{errors.product_billing_type}</p>
            )}
          </div> */}
          <div>
            <Label htmlFor="billing_type" className="mb-2">
              Fullfillment Type
            </Label>
            <Select
              value={data.product_fullfillment_type}
              onValueChange={(val) => setData('product_fullfillment_type', val as any)}
            >
              <SelectTrigger id="product_fullfillment_type">
                <SelectValue placeholder="Select fullfillment type" />
              </SelectTrigger>
              <SelectContent>
                {Object.values(ProductFullfillmentType).map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.product_billing_type && (
              <p className="mt-1 text-xs text-rose-600">{errors.product_billing_type}</p>
            )}
          </div>
        </div>

        <div className="md:col-span-2 border-b border-border pb-2 pt-1">
          <p className="text-sm font-semibold text-foreground">Section: SEO</p>
          <p className="text-xs text-muted-foreground">
            Opsional: optimasi mesin pencari untuk halaman produk.
          </p>
        </div>
        {/* SEO Enabled */}

        <div className="flex items-center gap-2">
          <Switch
            id="is_seo_enabled"
            checked={data.is_seo_enabled}
            onCheckedChange={(val) => setData('is_seo_enabled', val)}
          />
          <Label htmlFor="is_seo_enabled" className="mb-2">
            Enable SEO
          </Label>
        </div>
        {errors.is_seo_enabled && (
          <p className="mt-1 text-xs text-rose-600">{errors.is_seo_enabled}</p>
        )}

        {data.is_seo_enabled && (
          <>
            {/* SEO Title */}
            <div>
              <Label htmlFor="seo_title" className="mb-2">
                SEO Title
              </Label>
              <Input
                id="seo_title"
                value={data.seo_title || ''}
                onChange={(e) => setData('seo_title', e.target.value)}
              />
              {errors.seo_title && <p className="mt-1 text-xs text-rose-600">{errors.seo_title}</p>}
            </div>

            {/* SEO Description */}
            <div>
              <Label htmlFor="seo_description" className="mb-2">
                SEO Description
              </Label>
              <Textarea
                className="min-h-24"
                id="seo_description"
                value={data.seo_description || ''}
                onChange={(e) => setData('seo_description', e.target.value)}
              />
              {errors.seo_description && (
                <p className="mt-1 text-xs text-rose-600">{errors.seo_description}</p>
              )}
            </div>

            {/* SEO Image */}
            <div>
              <Label htmlFor="seo_image_id" className="mb-2">
                SEO Image
              </Label>
              <div className="mt-2 flex items-center gap-2">
                <FileManager onFilesSelected={(file) => setData('seo_image_id', file.id)} />
              </div>
              {errors.seo_image_id && (
                <p className="mt-1 text-xs text-rose-600">{errors.seo_image_id}</p>
              )}
            </div>
          </>
        )}

        <div className="flex justify-end pt-4 md:col-span-2">
          <Button type="submit" disabled={processing}>
            {processing ? 'Saving...' : 'Save Category'}
          </Button>
        </div>
      </form>
    </AdminLayout>
  )
}
