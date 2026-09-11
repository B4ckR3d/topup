import { useQuery } from '@tanstack/react-query'
import type { ColumnDef } from '@tanstack/react-table'
import type { InferSelectModel } from '@umbreon/db'
import type { tb } from '@umbreon/db/types'
import { DataTable } from '@umbreon/ui/components/data-table'
import { Button } from '@umbreon/ui/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@umbreon/ui/components/ui/tooltip'
import { Trash2Icon } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import type { GetAllProductsQueryValidator } from '#validators/product'
import Image from '~/components/image'
import { formatDate, formatPrice } from '~/utils'
import { apiClient } from '~/utils/axios'
import type { MetaPagination } from '~/utils/types/pagination_types'
import AddProductModal from './add-modal'
import AddProviderProductsModal from './add-provider-modal'
import DeleteProductModal from './delete-modal'
import EditProductModal from './edit-modal'
import IsAvailableSwitchProduct from './is-available-switch'
import UpdateProviderPriceModal from './update-provider-price-modal'

type Props = {
  productSubCategoryId: string | null
  selectedSubCategory?: {
    id: string
    is_available: boolean | null
    name: string
  } | null
  categoryName?: string
}

type Product = InferSelectModel<typeof tb.products>

export default function SectionProducts({
  productSubCategoryId,
  selectedSubCategory,
  categoryName,
}: Props) {
  const [queryParams, setQueryParams] = useState<GetAllProductsQueryValidator>({
    page: 1,
    limit: 10,
    searchQuery: '',
    searchBy: 'name',
    sortColumn: 'created_at',
    sortOrder: 'desc',
    productSubCategoryId: productSubCategoryId ?? undefined,
  })
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  useEffect(() => {
    if (productSubCategoryId) {
      setQueryParams((prev) => ({
        ...prev,
        productSubCategoryId,
      }))
      setSelectedIds([])
    }
  }, [productSubCategoryId])

  const products = useQuery<{ data: Product[]; meta: MetaPagination }>({
    queryKey: ['products', queryParams],
    queryFn: async () =>
      apiClient
        .get('/admin/products/all', {
          params: queryParams,
        })
        .then((res) => res.data)
        .catch((err) => {
          console.error('Error fetching products:', err)
          throw new Error('Failed to fetch products')
        }),
    enabled: !!productSubCategoryId,
  })

  const handlePageChange = (nextPage: number) => {
    setQueryParams((prev) => ({
      ...prev,
      page: nextPage,
    }))
  }

  const handleLimitChange = (limit: number) => {
    setQueryParams((prev) => ({
      ...prev,
      page: 1,
      limit,
    }))
  }

  const visibleIds = products.data?.data.map((item) => item.id) ?? []

  useEffect(() => {
    if (!products.data?.data) return
    setSelectedIds((prev) => {
      const next = prev.filter((id) => visibleIds.includes(id))
      if (next.length === prev.length && next.every((id, index) => id === prev[index])) {
        return prev
      }
      return next
    })
  }, [products.data?.data])

  const toggleSelectAll = () => {
    if (visibleIds.length === 0) return
    setSelectedIds((prev) => (prev.length === visibleIds.length ? [] : visibleIds))
  }

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    )
  }

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return
    if (!window.confirm(`Delete ${selectedIds.length} product(s)?`)) return

    const results = await Promise.allSettled(
      selectedIds.map((id) => apiClient.delete(`/admin/products/${id}`)),
    )

    const successCount = results.filter((res) => res.status === 'fulfilled').length
    const failCount = results.length - successCount

    if (successCount > 0) {
      toast.success(`Deleted ${successCount} product(s)`)
    }
    if (failCount > 0) {
      toast.error(`Failed to delete ${failCount} product(s)`)
    }

    setSelectedIds([])
  }

  const columns = useMemo<ColumnDef<Product>[]>(
    () => [
      {
        id: 'select',
        header: () => (
          <input
            type="checkbox"
            checked={visibleIds.length > 0 && selectedIds.length === visibleIds.length}
            onChange={toggleSelectAll}
          />
        ),
        cell: ({ row }) => (
          <input
            type="checkbox"
            checked={selectedIds.includes(row.original.id)}
            onChange={() => toggleSelectOne(row.original.id)}
          />
        ),
      },
      {
        accessorKey: 'image',
        header: 'Image',
        cell: ({ row }) => (
          <div className="aspect-square w-8 overflow-hidden rounded-md">
            <Image
              src={`${row.original.image_url}`}
              alt={row.getValue('name')}
              className="w-full h-full object-cover"
            />
          </div>
        ),
      },
      {
        accessorKey: 'id',
        header: 'ID',
      },
      {
        accessorKey: 'is_available',
        header: 'Available',
        cell: ({ row }) => (
          <IsAvailableSwitchProduct
            isAvailable={row.original.is_available}
            productId={row.original.id}
          />
        ),
      },
      {
        accessorKey: 'name',
        header: 'Name',
      },
      {
        accessorKey: 'sku_code',
        header: 'SKU Code',
      },
      {
        accessorKey: 'provider_name',
        header: 'Provider',
      },
      {
        accessorKey: 'provider_code',
        header: 'Provider Code',
      },
      {
        accessorKey: 'price',
        header: 'Price',
        cell: ({ row }) => formatPrice(row.original.price),
      },
      {
        accessorKey: 'provider_price',
        header: 'Provider Price',
        cell: ({ row }) => formatPrice(row.getValue('provider_price')),
      },
      {
        accessorKey: 'stock',
        header: 'Stock',
      },
      {
        accessorKey: 'created_at',
        header: 'Created At',
        cell: ({ row }) => formatDate(row.getValue('created_at')),
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <div className="flex flex-wrap gap-2">
            <EditProductModal productId={row.original.id} />
            <DeleteProductModal productId={row.original.id} />
          </div>
        ),
      },
    ],
    [selectedIds, visibleIds, toggleSelectAll, toggleSelectOne],
  )

  return (
    <section className="mt-4 min-w-0">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <h2 className="text-lg font-semibold">Products</h2>
        {productSubCategoryId && (
          <div className="flex flex-wrap items-center gap-2 rounded-md bg-muted/50 px-3 py-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  variant="destructive"
                  disabled={selectedIds.length === 0}
                  onClick={handleBulkDelete}
                  aria-label={`Delete Selected (${selectedIds.length})`}
                >
                  <Trash2Icon className="size-4" aria-hidden="true" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Delete Selected ({selectedIds.length})</TooltipContent>
            </Tooltip>
            <UpdateProviderPriceModal
              productSubCategoryId={productSubCategoryId}
              isSubCategoryActive={!!selectedSubCategory?.is_available}
            />
            <AddProviderProductsModal
              productSubCategoryId={productSubCategoryId}
              subCategoryName={selectedSubCategory?.name}
              categoryName={categoryName}
              isSubCategoryActive={true}
            />
            <AddProductModal productSubCategoryId={productSubCategoryId} />
          </div>
        )}
      </div>
      {!productSubCategoryId && (
        <div className="rounded-xl border border-dashed border-primary/30 bg-primary/5 p-6 text-center mt-4">
          <p className="text-sm font-semibold text-foreground">
            ⚡ Pilih salah satu Sub-Kategori di atas untuk melihat & mengimpor produk H2H.
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Jika belum ada sub-kategori, klik tombol <strong>"+ Add Sub Category"</strong> di atas
            terlebih dahulu.
          </p>
        </div>
      )}
      {selectedSubCategory && !selectedSubCategory.is_available && (
        <p className="text-xs text-muted-foreground mt-2">
          Sub-kategori ini sedang nonaktif. Anda tetap bisa mengimpor produk dan mengaktifkannya
          kapan saja.
        </p>
      )}
      <div className="mt-4 grid min-w-0">
        {products.isLoading && <p className="text-center">Loading products...</p>}
        {products.isError && (
          <p className="text-red-500 text-center">Failed to load products. Please try again.</p>
        )}
        {products.isSuccess && (
          <>
            <DataTable columns={columns} data={products.data.data} />
            <div className="flex flex-col gap-2 mt-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
              <span className="text-xs text-muted-foreground">
                Page {products.data.meta.page} of {products.data.meta.totalPages}
              </span>
              <div className="flex flex-wrap items-center gap-2 rounded-md bg-muted/50 px-3 py-2">
                <select
                  className="h-8 rounded-md border px-2 text-sm"
                  value={products.data.meta.limit}
                  onChange={(e) => handleLimitChange(Number(e.target.value))}
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={products.data.meta.page <= 1}
                  onClick={() => handlePageChange(products.data.meta.page - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={products.data.meta.page >= products.data.meta.totalPages}
                  onClick={() => handlePageChange(products.data.meta.page + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  )
}
