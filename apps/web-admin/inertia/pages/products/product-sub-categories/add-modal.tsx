import { useForm } from '@inertiajs/react'
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
import { PlusIcon } from 'lucide-react'
import { useState } from 'react'
import toast from 'react-hot-toast'
import type { CreateProductSubCategoryValidator } from '#validators/product'
import FileManager from '~/components/file-manager'

type Props = {
  productCategoryId: string
  categoryImage?: string
  initialName?: string
  triggerText?: string
  variant?: 'default' | 'outline' | 'secondary'
  size?: 'default' | 'sm' | 'lg' | 'icon'
}

export default function AddProductSubCategoryModal({
  productCategoryId,
  initialName = '',
  triggerText = '+ Add Sub Category',
  variant = 'default',
  size = 'sm',
}: Props) {
  const [open, setOpen] = useState(false)
  const [selectedFileName, setSelectedFileName] = useState<string>('')

  const { data, setData, errors, processing, post, reset } =
    useForm<CreateProductSubCategoryValidator>({
      product_category_id: productCategoryId,
      image_id: undefined,
      name: initialName,
      sub_name: '',
      description: '',
      is_available: true,
      is_featured: false,
      label: '',
    })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!data.name?.trim()) {
      toast.error('Nama Sub-Kategori wajib diisi!')
      return
    }

    post('/admin/product-sub-categories', {
      onSuccess: () => {
        toast.success('Sub-kategori berhasil dibuat!')
        reset()
        setSelectedFileName('')
        setOpen(false)
      },
      onError: (errs) => {
        console.error('Error creating sub-category:', errs)
        const firstErr = Object.values(errs)[0]
        toast.error(typeof firstErr === 'string' ? firstErr : 'Gagal membuat sub-kategori')
      },
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size={size} variant={variant} className="gap-1.5 font-medium">
          <PlusIcon className="size-4" />
          {triggerText}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-start">Tambah Sub-Kategori</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Gambar Sub-Kategori (Opsional)</Label>
            <p className="text-[11px] text-muted-foreground">
              Jika tidak dipilih, akan otomatis menggunakan gambar/logo game kategori utama.
            </p>
            {selectedFileName && (
              <p className="text-xs text-primary font-medium">Dipilih: {selectedFileName}</p>
            )}
            <div className="mt-1">
              <FileManager
                onFilesSelected={(f) => {
                  setData('image_id', f.id)
                  setSelectedFileName(f.name || 'File terpilih')
                }}
              />
            </div>
            {errors.image_id && <p className="text-red-500 text-xs mt-1">{errors.image_id}</p>}
          </div>

          <div>
            <Label className="mb-1.5 block text-xs font-medium" htmlFor="add-subcat-name">
              Nama Sub-Kategori <span className="text-red-500">*</span>
            </Label>
            <Input
              id="add-subcat-name"
              value={data.name || ''}
              onChange={(e) => setData('name', e.target.value)}
              placeholder="Misal: Diamonds, Weekly Pass, Reguler, Voucher"
            />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
          </div>

          <div>
            <Label className="mb-1.5 block text-xs font-medium" htmlFor="add-subcat-subname">
              Sub Name / Keterangan
            </Label>
            <Input
              id="add-subcat-subname"
              value={data.sub_name || ''}
              onChange={(e) => setData('sub_name', e.target.value)}
              placeholder="Misal: Proses Cepat & Aman 24 Jam"
            />
            {errors.sub_name && <p className="text-red-500 text-xs mt-1">{errors.sub_name}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div>
                <Label className="text-xs font-medium cursor-pointer" htmlFor="add-subcat-avail">
                  Tersedia
                </Label>
                <p className="text-[11px] text-muted-foreground">Status aktif</p>
              </div>
              <Switch
                id="add-subcat-avail"
                checked={!!data.is_available}
                onCheckedChange={(checked) => setData('is_available', checked)}
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div>
                <Label className="text-xs font-medium cursor-pointer" htmlFor="add-subcat-feat">
                  Featured
                </Label>
                <p className="text-[11px] text-muted-foreground">Tandai unggulan</p>
              </div>
              <Switch
                id="add-subcat-feat"
                checked={!!data.is_featured}
                onCheckedChange={(checked) => setData('is_featured', checked)}
              />
            </div>
          </div>

          <div>
            <Label className="mb-1.5 block text-xs font-medium" htmlFor="add-subcat-label">
              Label / Badge
            </Label>
            <Input
              id="add-subcat-label"
              value={data.label || ''}
              onChange={(e) => setData('label', e.target.value)}
              placeholder="Misal: PROMO, POPULER, BEST DEAL"
            />
            {errors.label && <p className="text-red-500 text-xs mt-1">{errors.label}</p>}
          </div>

          <div>
            <Label className="mb-1.5 block text-xs font-medium" htmlFor="add-subcat-desc">
              Deskripsi
            </Label>
            <Textarea
              id="add-subcat-desc"
              rows={3}
              value={data.description || ''}
              onChange={(e) => setData('description', e.target.value)}
              placeholder="Deskripsi singkat sub-kategori ini..."
            />
            {errors.description && (
              <p className="text-red-500 text-xs mt-1">{errors.description}</p>
            )}
          </div>

          <DialogFooter className="pt-2">
            <DialogClose asChild>
              <Button type="button" variant="secondary" onClick={() => reset()}>
                Batal
              </Button>
            </DialogClose>

            <Button type="submit" disabled={processing}>
              {processing ? 'Membuat...' : 'Buat Sub-Kategori'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
