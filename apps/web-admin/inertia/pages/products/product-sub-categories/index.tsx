import type { InferPageProps } from '@adonisjs/inertia/types'
import { router } from '@inertiajs/react'
import { Button } from '@umbreon/ui/components/ui/button'
import { Card, CardContent } from '@umbreon/ui/components/ui/card'
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
import { cn } from '@umbreon/ui/lib/utils'
import { Trash2 } from 'lucide-react'
import { useState } from 'react'
import toast from 'react-hot-toast'
import type ProductsCategoriesController from '#controllers/product_categories_controller'
import Image from '~/components/image'
import AddProductSubCategoryModal from './add-modal'
import EditProductSubCategoryModal from './edit-modal'

type Props = {
  productCategory: InferPageProps<ProductsCategoriesController, 'detail'>['productCategory']
  selectedSubId: string | null
  setSelectedSubId: (id: string | null) => void
}

export default function SectionProductSubCategory({
  productCategory,
  selectedSubId,
  setSelectedSubId,
}: Props) {
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleDelete = (id: string) => {
    setDeletingId(id)
    router.delete(`/admin/product-sub-categories/${id}`, {
      onSuccess: () => {
        toast.success('Sub-kategori berhasil dihapus!')
        setDeletingId(null)
        if (selectedSubId === id) {
          const remaining = (productCategory.product_sub_categories || []).filter(
            (s) => s.id !== id,
          )
          setSelectedSubId(remaining[0]?.id ?? null)
        }
      },
      onError: (errs) => {
        setDeletingId(null)
        const msg = Object.values(errs)[0] || 'Gagal menghapus sub-kategori'
        toast.error(String(msg))
      },
    })
  }

  const subCategories = productCategory.product_sub_categories || []

  return (
    <section className="mt-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Sub Categories</h2>
          <p className="text-xs text-muted-foreground">
            Kelompok produk untuk {productCategory.name}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <AddProductSubCategoryModal
            productCategoryId={productCategory.id}
            categoryImage={productCategory.image_url}
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-3 mt-3">
        {subCategories.length < 1 && (
          <div className="w-full rounded-xl border border-dashed border-amber-500/40 bg-amber-500/10 p-5 text-center">
            <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">
              ⚠️ Belum ada Sub-Kategori untuk game/kategori ini
            </p>
            <p className="text-xs text-muted-foreground mt-1 max-w-xl mx-auto">
              Produk H2H dikelompokkan di dalam Sub-Kategori (misal: <em>"Diamonds"</em>,{' '}
              <em>"Weekly Pass"</em>, atau <em>"Reguler"</em>). Silakan klik tombol{' '}
              <strong>"+ Add Sub Category"</strong> atau buat cepat dengan template di bawah:
            </p>
            <div className="flex flex-wrap justify-center items-center gap-2 mt-3">
              <AddProductSubCategoryModal
                productCategoryId={productCategory.id}
                categoryImage={productCategory.image_url}
                initialName="Reguler"
                triggerText='+ Buat "Reguler"'
                variant="outline"
              />
              <AddProductSubCategoryModal
                productCategoryId={productCategory.id}
                categoryImage={productCategory.image_url}
                initialName="Diamonds"
                triggerText='+ Buat "Diamonds"'
                variant="outline"
              />
              <AddProductSubCategoryModal
                productCategoryId={productCategory.id}
                categoryImage={productCategory.image_url}
                initialName="Voucher"
                triggerText='+ Buat "Voucher"'
                variant="outline"
              />
            </div>
          </div>
        )}

        {subCategories.map((sub) => {
          const isSelected = sub.id === selectedSubId
          const imageUrl = sub.image_url || productCategory.image_url

          return (
            <Card
              key={sub.id}
              className={cn(
                'group relative cursor-pointer py-0 shadow-none transition-all duration-200 hover:border-primary/50 hover:shadow-sm',
                {
                  'border-primary bg-primary/5 ring-2 ring-primary/30 shadow-sm': isSelected,
                  'border-border/80': !isSelected,
                },
              )}
              onClick={() => setSelectedSubId(sub.id)}
            >
              <CardContent className="flex items-center justify-between gap-4 min-w-[210px] p-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  {imageUrl ? (
                    <div className="size-9 rounded-md overflow-hidden shrink-0 border border-border bg-background">
                      <Image src={imageUrl} alt={sub.name} className="size-full object-cover" />
                    </div>
                  ) : null}
                  <div className="min-w-0">
                    <h3 className="font-semibold text-sm text-foreground truncate">{sub.name}</h3>
                    {sub.sub_name && (
                      <p className="text-[11px] text-muted-foreground truncate">{sub.sub_name}</p>
                    )}
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span
                        className={cn('size-1.5 rounded-full inline-block', {
                          'bg-emerald-500': sub.is_available,
                          'bg-muted-foreground/50': !sub.is_available,
                        })}
                      />
                      <span className="text-[10px] text-muted-foreground">
                        {sub.is_available ? 'Aktif' : 'Nonaktif'}
                      </span>
                      {sub.label && (
                        <span className="text-[9px] px-1 py-0.2 rounded bg-primary/10 text-primary font-medium">
                          {sub.label}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions wrapper with stopPropagation */}
                <div
                  className="opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex items-center gap-0.5 shrink-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <EditProductSubCategoryModal
                    subCategory={sub}
                    categoryImage={productCategory.image_url}
                  />

                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                        title="Hapus Sub-Kategori"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Hapus Sub-Kategori?</DialogTitle>
                        <DialogDescription>
                          Tindakan ini akan menghapus sub-kategori <strong>"{sub.name}"</strong>{' '}
                          beserta seluruh produk di dalamnya. Tindakan ini tidak dapat dibatalkan.
                        </DialogDescription>
                      </DialogHeader>
                      <DialogFooter className="gap-2">
                        <DialogClose asChild>
                          <Button variant="outline">Batal</Button>
                        </DialogClose>
                        <Button
                          variant="destructive"
                          disabled={deletingId === sub.id}
                          onClick={() => handleDelete(sub.id)}
                        >
                          {deletingId === sub.id ? 'Menghapus...' : 'Ya, Hapus'}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </section>
  )
}
