import type { InferPageProps } from '@adonisjs/inertia/types'
import { router, useForm } from '@inertiajs/react'
import type { ColumnDef } from '@tanstack/react-table'
import { BannerLocation } from '@umbreon/db/types'
import { DataTable } from '@umbreon/ui/components/data-table'
import { Badge } from '@umbreon/ui/components/ui/badge'
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
import { useEffect, useMemo, useState } from 'react'
import type BannersController from '#controllers/banners_controller'
import type { CreateBannerValidator } from '#validators/banners'
import FileManager from '~/components/file-manager'
import Image from '~/components/image'
import AdminLayout from '~/components/layout/admin-layout'
import { formatDate } from '~/utils'
import { apiClient } from '~/utils/axios'

type Props = InferPageProps<BannersController, 'index'>

type Banner = {
  id: string
  title: string
  description: string | null
  image_url: string
  is_available: boolean | null
  banner_location?: BannerLocation | string | null
  product_category_id: string | null
  created_at?: string | Date | null
  updated_at?: string | Date | null
}

function AddBannerDialog({ trigger }: { trigger?: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const form = useForm<CreateBannerValidator>({
    title: '',
    image_id: '' as any,
    description: '',
    is_available: true,
    product_category_id: '' as any,
    banner_location: BannerLocation.HOME_TOP,
    href_url: '',
    app_url: '',
  })

  const [categoryQuery, setCategoryQuery] = useState('')
  const [categoryResults, setCategoryResults] = useState<Array<{ id: string; name: string }>>([])
  const [isSearchingCategory, setIsSearchingCategory] = useState(false)

  useEffect(() => {
    if (!categoryQuery || categoryQuery.length < 2) {
      setCategoryResults([])
      setIsSearchingCategory(false)
      return
    }

    let active = true
    setIsSearchingCategory(true)
    const t = setTimeout(async () => {
      try {
        const res = await apiClient.get('/admin/product-categories/get-json', {
          params: { searchBy: 'name', searchQuery: categoryQuery, page: 1, limit: 100 },
        })
        const payload = res.data ?? {}
        const list = Array.isArray(payload.productCategories)
          ? payload.productCategories
          : Array.isArray(payload.data)
            ? payload.data
            : []
        if (active) {
          setCategoryResults(
            list.map((x: any) => ({ id: x.id, name: (x as any).name ?? (x as any).slug ?? x.id })),
          )
        }
      } catch (err) {
        console.error('Failed to search product categories', err)
      } finally {
        if (active) {
          setIsSearchingCategory(false)
        }
      }
    }, 300)

    return () => {
      active = false
      clearTimeout(t)
    }
  }, [categoryQuery])

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    form.transform((data) => ({
      ...data,
      description: data.description?.trim() ? data.description.trim() : undefined,
      product_category_id: data.product_category_id?.trim()
        ? data.product_category_id.trim()
        : undefined,
      href_url: data.href_url?.trim() ? data.href_url.trim() : undefined,
      app_url: data.app_url?.trim() ? data.app_url.trim() : undefined,
    }))
    form.post('/admin/config/home/banner', {
      preserveScroll: true,
      onSuccess: () => {
        setOpen(false)
        form.reset()
        setCategoryQuery('')
        setCategoryResults([])
      },
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="gap-1.5 shadow-sm">
            <Plus className="size-4" />
            Tambah Banner
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Tambah Banner Promosi</DialogTitle>
          <DialogDescription>Isi detail banner promosi di bawah ini.</DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={submit}>
          <div>
            <Label htmlFor="title">Judul</Label>
            <Input
              id="title"
              value={form.data.title}
              onChange={(e) => form.setData('title', e.target.value)}
            />
            {form.errors.title && <p className="text-xs text-red-500 mt-1">{form.errors.title}</p>}
          </div>

          <div>
            <Label htmlFor="description">Deskripsi</Label>
            <Textarea
              id="description"
              value={form.data.description || ''}
              onChange={(e) => form.setData('description', e.target.value)}
            />
            {form.errors.description && (
              <p className="text-xs text-red-500 mt-1">{form.errors.description}</p>
            )}
          </div>

          <div>
            <Label htmlFor="image">Image Banner</Label>
            <FileManager onFilesSelected={(f) => form.setData('image_id', (f as any).id)} />
            {form.data.image_id && (
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-1">
                ✓ Image selected (ID: {form.data.image_id})
              </p>
            )}
            {form.errors.image_id && (
              <p className="text-xs text-red-500 mt-1">{form.errors.image_id}</p>
            )}
          </div>

          <div>
            <Label htmlFor="banner_location">Banner Location</Label>
            <Select
              value={form.data.banner_location}
              onValueChange={(v) => form.setData('banner_location', v as BannerLocation)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Pilih lokasi banner" />
              </SelectTrigger>
              <SelectContent>
                {Object.values(BannerLocation).map((loc) => (
                  <SelectItem key={loc} value={loc}>
                    {loc}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.errors.banner_location && (
              <p className="text-xs text-red-500 mt-1">{form.errors.banner_location}</p>
            )}
          </div>

          <div>
            <Label htmlFor="href_url">Href URL (External Web Link)</Label>
            <Input
              id="href_url"
              placeholder="https://..."
              value={form.data.href_url || ''}
              onChange={(e) => form.setData('href_url', e.target.value)}
            />
            {form.errors.href_url && (
              <p className="text-xs text-red-500 mt-1">{form.errors.href_url}</p>
            )}
          </div>

          <div>
            <Label htmlFor="app_url">App URL (Internal App Link)</Label>
            <Input
              id="app_url"
              placeholder="/promo/..."
              value={form.data.app_url || ''}
              onChange={(e) => form.setData('app_url', e.target.value)}
            />
            {form.errors.app_url && (
              <p className="text-xs text-red-500 mt-1">{form.errors.app_url}</p>
            )}
          </div>

          <div className="space-y-4 pt-2 border-t">
            <div className="flex items-center space-x-2">
              <Switch
                id="is_available"
                checked={!!form.data.is_available}
                onCheckedChange={(c) => form.setData('is_available', c)}
              />
              <Label htmlFor="is_available">Aktifkan Banner</Label>
            </div>
            <div>
              <Label htmlFor="product_category_id">Product Category (Opsional)</Label>
              <Input
                id="product_category_search"
                value={categoryQuery}
                onChange={(e) => setCategoryQuery(e.target.value)}
                placeholder="Cari kategori produk terkait..."
              />
              {isSearchingCategory && (
                <p className="text-xs text-muted-foreground mt-1">Mencari…</p>
              )}
              {categoryResults.length > 0 && (
                <div className="max-h-56 overflow-auto border rounded-md divide-y mt-2">
                  {categoryResults.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      className={`w-full text-left px-3 py-2 hover:bg-muted ${
                        form.data.product_category_id === c.id ? 'bg-muted' : ''
                      }`}
                      onClick={() => {
                        form.setData('product_category_id', c.id)
                        setCategoryQuery(c.name)
                      }}
                    >
                      <div className="font-medium text-sm">{c.name}</div>
                      <div className="text-xs text-muted-foreground">{c.id}</div>
                    </button>
                  ))}
                </div>
              )}
              <Input
                className="mt-2"
                id="product_category_id"
                value={form.data.product_category_id || ''}
                onChange={(e) => form.setData('product_category_id', e.target.value)}
                placeholder="Atau masukkan UUID manual"
              />
              {form.errors.product_category_id && (
                <p className="text-xs text-red-500 mt-1">{form.errors.product_category_id}</p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={form.processing}>
              {form.processing ? 'Menyimpan...' : 'Simpan Banner'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function DeleteBannerDialog({ title, onConfirm }: { title: string; onConfirm?: () => void }) {
  const [open, setOpen] = useState(false)
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          Hapus
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Hapus banner?</DialogTitle>
          <DialogDescription>
            Apakah Anda yakin ingin menghapus banner <strong>"{title}"</strong>?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-4 flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
            Batal
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => {
              setOpen(false)
              if (onConfirm) onConfirm()
            }}
          >
            Hapus
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default function BannersIndex({ banners }: Props) {
  const [items, setItems] = useState<Banner[]>(() =>
    Array.isArray(banners) ? (banners as any) : [],
  )
  useEffect(() => {
    setItems(Array.isArray(banners) ? (banners as any) : [])
  }, [banners])

  const columns = useMemo<ColumnDef<Banner>[]>(
    () => [
      {
        accessorKey: 'image_url',
        header: 'Image',
        cell: ({ row }) => (
          <div className="w-20 h-11 border rounded-lg overflow-hidden bg-muted/60 flex items-center justify-center shadow-xs">
            {row.original.image_url ? (
              <Image
                src={row.original.image_url}
                alt={row.original.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-[10px] text-muted-foreground">No image</span>
            )}
          </div>
        ),
      },
      { accessorKey: 'title', header: 'Title' },
      {
        accessorKey: 'description',
        header: 'Description',
        cell: ({ row }) => (
          <span className="line-clamp-2 max-w-105 text-muted-foreground text-sm">
            {row.original.description ?? '-'}
          </span>
        ),
      },
      {
        accessorKey: 'is_available',
        header: 'Status',
        cell: ({ row }) => (
          <Badge
            variant={row.original.is_available ? 'default' : 'secondary'}
            className={
              row.original.is_available
                ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 font-medium'
                : 'bg-muted text-muted-foreground'
            }
          >
            {row.original.is_available ? 'Aktif' : 'Disembunyikan'}
          </Badge>
        ),
      },
      {
        accessorKey: 'product_category_id',
        header: 'Category',
        cell: ({ row }) => row.original.product_category_id ?? '-',
      },
      {
        accessorKey: 'banner_location',
        header: 'Location',
        cell: ({ row }) => row.original.banner_location ?? '-',
      },
      {
        accessorKey: 'created_at',
        header: 'Created',
        cell: ({ row }) => formatDate(row.getValue('created_at')),
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <div className="flex justify-end">
            <DeleteBannerDialog
              title={row.original.title}
              onConfirm={() =>
                router.delete(`/admin/config/home/banner/${row.original.id}` as any, {
                  preserveScroll: true,
                  onSuccess: () => setItems((prev) => prev.filter((x) => x.id !== row.original.id)),
                })
              }
            />
          </div>
        ),
      },
    ],
    [],
  )

  return (
    <AdminLayout>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Banners Promosi</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Kelola gambar banner dan slider promosi di beranda aplikasi toko.
          </p>
        </div>
        <AddBannerDialog />
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/80 bg-card/50 p-12 text-center">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-3 shadow-xs">
            <ImageIcon className="size-7" />
          </div>
          <h3 className="text-base font-semibold text-foreground">Belum Ada Banner Promo</h3>
          <p className="text-sm text-muted-foreground max-w-sm mt-1 mb-5">
            Unggah banner visual untuk menarik perhatian pengunjung dan menampilkan penawaran
            spesial di beranda storefront.
          </p>
          <AddBannerDialog
            trigger={
              <Button className="gap-1.5 shadow-sm">
                <Plus className="size-4" />
                Upload Banner Pertama
              </Button>
            }
          />
        </div>
      ) : (
        <div className="rounded-xl border border-border/70 bg-card overflow-hidden shadow-sm">
          <DataTable columns={columns} data={items} />
        </div>
      )}
    </AdminLayout>
  )
}
