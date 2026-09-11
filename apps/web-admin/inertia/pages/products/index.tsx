import type { InferPageProps } from '@adonisjs/inertia/types'
import { Link, router } from '@inertiajs/react'
import type { ColumnDef } from '@tanstack/react-table'
import { DataTable } from '@umbreon/ui/components/data-table'
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@umbreon/ui/components/ui/dropdown-menu'
import { Input } from '@umbreon/ui/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@umbreon/ui/components/ui/select'
import { ChevronDown, DownloadCloud, Plus } from 'lucide-react'
import { useState } from 'react'
import type ProductsCategoriesController from '#controllers/product_categories_controller'
import { AutoCrawlDialog } from '~/components/auto-crawl-dialog'
import Image from '~/components/image'
import AdminLayout from '~/components/layout/admin-layout'
import { formatDate } from '~/utils'
import IsAvailable from './product-categories/is-avalable'

type Props = InferPageProps<ProductsCategoriesController, 'index'>

export default function ProductCategory(props: Props) {
  const { productCategories, pagination, filters } = props
  const [searchBy, setSearchBy] = useState(filters.searchBy || 'id')
  const [searchQuery, setSearchQuery] = useState(filters.searchQuery || '')

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    router.get('/admin/product-categories', { searchBy, searchQuery })
  }

  const handlePageChange = (page: number) => {
    router.get('/admin/product-categories', { ...filters, page })
  }

  return (
    <AdminLayout>
      <div className="mb-4 mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Product Categories</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Kelola game & layanan. Gunakan <strong>"Auto-Crawl Digiflazz"</strong> untuk membuat
            katalog game & produk secara massal otomatis!
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <AutoCrawlDialog
            triggerText="⚡ Auto-Crawl Digiflazz"
            variant="outline"
            className="border-amber-500/40 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10"
          />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="gap-1 bg-primary font-medium shadow-sm">
                <Plus className="size-4" />
                <span>Add New</span>
                <ChevronDown className="size-3.5 opacity-70" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="text-xs text-muted-foreground uppercase tracking-wider">
                Prabayar (Prepaid)
              </DropdownMenuLabel>
              <DropdownMenuItem asChild>
                <Link href="/admin/product-categories/game/create">Game</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/admin/product-categories/pulsa/create">Pulsa</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/admin/product-categories/kuota/create">Kuota Data</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/admin/product-categories/token-pln/create">Token PLN</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/admin/product-categories/e-wallet/create">E-Wallet</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/admin/product-categories/voucher/create">Voucher</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/admin/product-categories/other-prepaid/create">Other Prepaid</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-xs text-muted-foreground uppercase tracking-wider">
                Pascabayar (Postpaid)
              </DropdownMenuLabel>
              <DropdownMenuItem asChild>
                <Link href="/admin/product-categories/postpaid/tagihan-pln/create">
                  Tagihan PLN
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/admin/product-categories/postpaid/pdam/create">PDAM</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/admin/product-categories/postpaid/internet/create">Internet</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/admin/product-categories/postpaid/bpjs-kesehatan/create">
                  BPJS Kesehatan
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/admin/product-categories/postpaid/bpjs-ketenagakerjaan/create">
                  BPJS Ketenagakerjaan
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <form
        className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card/90 p-3"
        onSubmit={handleSearch}
      >
        <Select onValueChange={(v) => setSearchBy(v as 'id' | 'name')} value={searchBy}>
          <SelectTrigger size="sm" className="min-w-[120px] rounded-md">
            <SelectValue placeholder="Pilih Tipe" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="id">ID</SelectItem>
            <SelectItem value="name">Name</SelectItem>
          </SelectContent>
        </Select>
        <Input
          placeholder="Search..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="h-8 w-56 rounded-md text-sm"
        />
        <Button type="submit" size="sm">
          Search
        </Button>
      </form>
      <div className="overflow-hidden rounded-xl border border-border bg-card/95 shadow-sm">
        <DataTable columns={columns} data={productCategories} />
      </div>
      <div className="mt-4 flex items-center justify-between rounded-lg border border-border bg-card/80 px-3 py-2">
        <span>
          Page {pagination.page} of {pagination.totalPages}
        </span>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={pagination.page <= 1}
            onClick={() => handlePageChange(pagination.page - 1)}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={pagination.page >= pagination.totalPages}
            onClick={() => handlePageChange(pagination.page + 1)}
          >
            Next
          </Button>
        </div>
      </div>
    </AdminLayout>
  )
}

const columns: ColumnDef<Props['productCategories'][number]>[] = [
  {
    accessorKey: 'image',
    header: 'Image',
    cell: ({ row }) => (
      <div className="aspect-square w-20 overflow-hidden rounded-md">
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
    accessorKey: 'name',
    header: 'Name',
  },
  {
    accessorKey: 'is_available',
    header: 'Available',
    cell: ({ row }) => (
      <IsAvailable
        key={row.original.id}
        isAvailable={row.original.is_available}
        id={row.original.id}
        type="game"
      />
    ),
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
        <Button
          size="sm"
          className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 font-medium shadow-sm"
          asChild
        >
          <Link href={`/admin/product-categories/${row.original.id}`}>
            <DownloadCloud className="size-3.5" />
            <span>Kelola & Import Produk</span>
          </Link>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link href={`/admin/product-categories/${row.original.id}/edit`}>Edit</Link>
        </Button>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="destructive" size="sm">
              Delete
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Are you absolutely sure?</DialogTitle>
              <DialogDescription>
                This action cannot be undone. This will permanently delete your account and remove
                your data from our servers.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="destructive"
                onClick={() => {
                  router.delete(`/admin/product-categories/${row.original.id}`, {
                    preserveScroll: true,
                    onSuccess: () => {
                      router.get('/admin/product-categories')
                    },
                  })
                }}
              >
                Yes, delete account
              </Button>
              <Button variant="outline">Cancel</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    ),
  },
]
