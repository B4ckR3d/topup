import { router, useForm } from '@inertiajs/react'
import { Button } from '@umbreon/ui/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@umbreon/ui/components/ui/dialog'
import { Input } from '@umbreon/ui/components/ui/input'
import { Label } from '@umbreon/ui/components/ui/label'
import { Switch } from '@umbreon/ui/components/ui/switch'
import { Textarea } from '@umbreon/ui/components/ui/textarea'
import { EditIcon, ImageIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import type { UpdateProductSubCategoryValidator } from '#validators/product'
import FileManager from '~/components/file-manager'
import Image from '~/components/image'
import { apiClient } from '~/utils/axios'

export type SubCategoryItem = {
  id: string
  name: string
  sub_name?: string | null
  description?: string | null
  image_url?: string | null
  is_available?: boolean | null
  is_featured?: boolean | null
  label?: string | null
  product_category_id?: string
}

type Props = {
  productSubCategoryId?: string
  subCategory?: SubCategoryItem
  categoryImage?: string
}

export default function EditProductSubCategoryModal({
  productSubCategoryId,
  subCategory: initialSubCategory,
  categoryImage,
}: Props) {
  const [open, setOpen] = useState(false)
  const [currentSub, setCurrentSub] = useState<SubCategoryItem | undefined>(initialSubCategory)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedImageName, setSelectedImageName] = useState<string>('')

  const subId = initialSubCategory?.id || productSubCategoryId || ''

  const { data, setData, errors, processing, reset } = useForm<UpdateProductSubCategoryValidator>({
    product_category_id: initialSubCategory?.product_category_id,
    image_id: '',
    name: initialSubCategory?.name || '',
    sub_name: initialSubCategory?.sub_name || '',
    description: initialSubCategory?.description || '',
    is_available: initialSubCategory?.is_available ?? true,
    is_featured: initialSubCategory?.is_featured ?? false,
    label: initialSubCategory?.label || '',
  })

  // Synchronize when initialSubCategory prop changes
  useEffect(() => {
    if (initialSubCategory) {
      setCurrentSub(initialSubCategory)
      setData({
        product_category_id: initialSubCategory.product_category_id,
        image_id: '',
        name: initialSubCategory.name || '',
        sub_name: initialSubCategory.sub_name || '',
        description: initialSubCategory.description || '',
        is_available: initialSubCategory.is_available ?? true,
        is_featured: initialSubCategory.is_featured ?? false,
        label: initialSubCategory.label || '',
      })
    }
  }, [initialSubCategory])

  // If subCategory was not passed directly, fetch once when dialog opens
  useEffect(() => {
    if (!open || initialSubCategory || !subId) return
    let isMounted = true
    setIsLoading(true)

    apiClient
      .get(`/admin/product-sub-categories/${subId}`)
      .then((res) => {
        if (!isMounted) return
        const fetched = res.data?.data
        if (fetched) {
          setCurrentSub(fetched)
          setData({
            product_category_id: fetched.product_category_id,
            image_id: fetched.image_id || '',
            name: fetched.name || '',
            sub_name: fetched.sub_name || '',
            description: fetched.description || '',
            is_available: fetched.is_available ?? true,
            is_featured: fetched.is_featured ?? false,
            label: fetched.label || '',
          })
        }
      })
      .catch((err) => {
        console.error('Failed to fetch sub-category details:', err)
        toast.error('Gagal mengambil data sub-kategori')
      })
      .finally(() => {
        if (isMounted) setIsLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [open, subId, initialSubCategory])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!data.name?.trim()) {
      toast.error('Nama Sub-Kategori wajib diisi')
      return
    }

    const payload: Record<string, any> = {
      name: data.name.trim(),
      sub_name: data.sub_name?.trim() || '',
      description: data.description?.trim() || '',
      is_available: data.is_available ?? true,
      is_featured: data.is_featured ?? false,
      label: data.label?.trim() || '',
    }

    if (data.image_id) {
      payload.image_id = data.image_id
    }

    router.patch(`/admin/product-sub-categories/${subId}`, payload, {
      onSuccess: () => {
        toast.success('Sub-kategori berhasil diperbarui!')
        setOpen(false)
      },
      onError: (errs) => {
        const firstErr = Object.values(errs)[0]
        toast.error(typeof firstErr === 'string' ? firstErr : 'Gagal memperbarui sub-kategori')
      },
    })
  }

  const displayImageUrl = currentSub?.image_url || categoryImage

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8 hover:bg-primary/10 hover:text-primary"
          title="Edit Sub-Kategori"
        >
          <EditIcon className="h-3.5 w-3.5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-start">Edit Sub-Kategori</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            Memuat data sub-kategori...
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Image Preview & Selector */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Gambar Sub-Kategori</Label>
              <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/20">
                {displayImageUrl ? (
                  <div className="size-14 rounded-md overflow-hidden border border-border shrink-0 bg-background">
                    <Image src={displayImageUrl} alt="Preview" className="size-full object-cover" />
                  </div>
                ) : (
                  <div className="size-14 rounded-md border border-dashed border-border flex items-center justify-center shrink-0 bg-background text-muted-foreground">
                    <ImageIcon className="size-6 opacity-50" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">
                    {selectedImageName ? `Dipilih: ${selectedImageName}` : 'Gambar saat ini'}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Klik di bawah untuk mengganti gambar (opsional)
                  </p>
                  <div className="mt-2">
                    <FileManager
                      onFilesSelected={(file) => {
                        setData('image_id', file.id)
                        setSelectedImageName(file.name || 'Gambar terpilih')
                      }}
                      defaultFileId={data.image_id || undefined}
                    />
                  </div>
                </div>
              </div>
              {errors.image_id && <p className="text-xs text-red-500">{errors.image_id}</p>}
            </div>

            <div>
              <Label className="mb-1.5 block text-xs font-medium" htmlFor="subcat-name">
                Nama Sub-Kategori <span className="text-red-500">*</span>
              </Label>
              <Input
                id="subcat-name"
                value={data.name || ''}
                onChange={(e) => setData('name', e.target.value)}
                placeholder="Contoh: Diamonds, Weekly Pass, Reguler"
              />
              {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
            </div>

            <div>
              <Label className="mb-1.5 block text-xs font-medium" htmlFor="subcat-subname">
                Sub Name / Keterangan Singkat
              </Label>
              <Input
                id="subcat-subname"
                value={data.sub_name || ''}
                onChange={(e) => setData('sub_name', e.target.value)}
                placeholder="Contoh: Fast Delivery, Instant 24 Jam"
              />
              {errors.sub_name && <p className="text-xs text-red-500 mt-1">{errors.sub_name}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center justify-between rounded-lg border border-border p-3">
                <div>
                  <Label className="text-xs font-medium cursor-pointer" htmlFor="subcat-available">
                    Tersedia (Aktif)
                  </Label>
                  <p className="text-[11px] text-muted-foreground">Aktifkan untuk pesanan</p>
                </div>
                <Switch
                  id="subcat-available"
                  checked={!!data.is_available}
                  onCheckedChange={(checked) => setData('is_available', checked)}
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border border-border p-3">
                <div>
                  <Label className="text-xs font-medium cursor-pointer" htmlFor="subcat-featured">
                    Featured
                  </Label>
                  <p className="text-[11px] text-muted-foreground">Tampilkan di unggulan</p>
                </div>
                <Switch
                  id="subcat-featured"
                  checked={!!data.is_featured}
                  onCheckedChange={(checked) => setData('is_featured', checked)}
                />
              </div>
            </div>

            <div>
              <Label className="mb-1.5 block text-xs font-medium" htmlFor="subcat-label">
                Badge / Label
              </Label>
              <Input
                id="subcat-label"
                value={data.label || ''}
                onChange={(e) => setData('label', e.target.value)}
                placeholder="Contoh: PROMO, POPULER, BEST SELLER"
              />
              {errors.label && <p className="text-xs text-red-500 mt-1">{errors.label}</p>}
            </div>

            <div>
              <Label className="mb-1.5 block text-xs font-medium" htmlFor="subcat-description">
                Deskripsi
              </Label>
              <Textarea
                id="subcat-description"
                rows={3}
                value={data.description || ''}
                onChange={(e) => setData('description', e.target.value)}
                placeholder="Keterangan mengenai sub-kategori ini..."
              />
              {errors.description && (
                <p className="text-xs text-red-500 mt-1">{errors.description}</p>
              )}
            </div>

            <DialogFooter className="pt-2">
              <DialogClose asChild>
                <Button type="button" variant="secondary" onClick={() => reset()}>
                  Batal
                </Button>
              </DialogClose>
              <Button type="submit" disabled={processing}>
                {processing ? 'Menyimpan...' : 'Simpan Perubahan'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
