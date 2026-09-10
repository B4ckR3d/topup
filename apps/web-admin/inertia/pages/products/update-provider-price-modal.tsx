import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ProductProvider } from '@umbreon/db/types'
import { Button } from '@umbreon/ui/components/ui/button'
import { Checkbox } from '@umbreon/ui/components/ui/checkbox'
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@umbreon/ui/components/ui/table'
import { Tooltip, TooltipContent, TooltipTrigger } from '@umbreon/ui/components/ui/tooltip'
import { RefreshCwIcon } from 'lucide-react'
import { useDeferredValue, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { apiClient } from '~/utils/axios'

type DigiflazzProductPrepaid = {
  product_name: string
  category: string
  brand: string
  type: string
  price: number
  buyer_sku_code: string
  buyer_product_status: boolean
  seller_product_status: boolean
}

type ProviderProductMap = {
  id: string
  name: string
  provider_code: string
  provider_price: number
  provider_max_price: number
  profit_static: number
  profit_percentage: number
}

type Props = {
  productSubCategoryId: string
  isSubCategoryActive: boolean
}

export default function UpdateProviderPriceModal({
  productSubCategoryId,
  isSubCategoryActive,
}: Props) {
  const [open, setOpen] = useState(false)
  const queryClient = useQueryClient()
  const [provider, setProvider] = useState<ProductProvider>(ProductProvider.DIGIFLAZZ)
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [brandFilter, setBrandFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [search, setSearch] = useState('')
  const deferredSearch = useDeferredValue(search)
  const [maxPriceMode, setMaxPriceMode] = useState<'provider' | 'total'>('provider')
  const [selectedCodes, setSelectedCodes] = useState<string[]>([])
  const selectedSet = useMemo(() => new Set(selectedCodes), [selectedCodes])
  const [hideUnmatched, setHideUnmatched] = useState(true)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(50)

  const providerProducts = useQuery<{ data: DigiflazzProductPrepaid[] }>({
    queryKey: ['digiflazz-products', provider],
    queryFn: async () =>
      apiClient
        .get('/admin/providers/digiflazz/products', {
          params: { billingType: 'prepaid' },
        })
        .then((res) => res.data),
    enabled: open && provider === ProductProvider.DIGIFLAZZ,
    retry: 1,
  })

  const providerMap = useQuery<{ data: ProviderProductMap[] }>({
    queryKey: ['provider-map', productSubCategoryId, provider],
    queryFn: async () =>
      apiClient
        .get('/admin/products/provider-map', {
          params: { productSubCategoryId, providerName: provider },
        })
        .then((res) => res.data),
    enabled: open,
  })

  const mapByCode = useMemo(() => {
    const entries = providerMap.data?.data ?? []
    return new Map(entries.map((item) => [item.provider_code, item]))
  }, [providerMap.data?.data])

  const options = useMemo(() => {
    const list = providerProducts.data?.data ?? []
    const categories = Array.from(new Set(list.map((item) => item.category))).sort()

    const brandBase =
      categoryFilter === 'all' ? list : list.filter((item) => item.category === categoryFilter)
    const brands = Array.from(new Set(brandBase.map((item) => item.brand))).sort()

    const typeBase =
      brandFilter === 'all' ? brandBase : brandBase.filter((item) => item.brand === brandFilter)
    const types = Array.from(new Set(typeBase.map((item) => item.type))).sort()

    return { categories, brands, types }
  }, [providerProducts.data?.data, categoryFilter, brandFilter])

  const filteredProducts = useMemo(() => {
    const list = providerProducts.data?.data ?? []
    return list.filter((item) => {
      if (categoryFilter !== 'all' && item.category !== categoryFilter) return false
      if (brandFilter !== 'all' && item.brand !== brandFilter) return false
      if (typeFilter !== 'all' && item.type !== typeFilter) return false
      if (deferredSearch) {
        const target = `${item.product_name} ${item.buyer_sku_code} ${item.brand}`.toLowerCase()
        if (!target.includes(deferredSearch.toLowerCase())) return false
      }
      if (hideUnmatched && !mapByCode.has(item.buyer_sku_code)) return false
      return true
    })
  }, [
    providerProducts.data?.data,
    categoryFilter,
    brandFilter,
    typeFilter,
    deferredSearch,
    hideUnmatched,
    mapByCode,
  ])

  const sortedProducts = useMemo(() => {
    return [...filteredProducts].sort((a, b) => Number(a.price) - Number(b.price))
  }, [filteredProducts])

  const totalPages = Math.max(1, Math.ceil(sortedProducts.length / pageSize))
  const pageSafe = Math.min(page, totalPages)
  const pagedProducts = useMemo(() => {
    const start = (pageSafe - 1) * pageSize
    return sortedProducts.slice(start, start + pageSize)
  }, [sortedProducts, pageSafe, pageSize])

  const toggleSelection = (code: string) => {
    setSelectedCodes((prev) =>
      prev.includes(code) ? prev.filter((item) => item !== code) : [...prev, code],
    )
  }

  const resetPaging = () => setPage(1)

  const updatePrices = useMutation({
    mutationFn: async () => {
      const selectedItems = filteredProducts.filter((item) =>
        selectedCodes.includes(item.buyer_sku_code),
      )
      for (const item of selectedItems) {
        const match = mapByCode.get(item.buyer_sku_code)
        if (!match) continue

        const totalPrice =
          Number(item.price) +
          Number(match.profit_static) +
          (Number(item.price) * Number(match.profit_percentage)) / 100
        const providerMaxPrice =
          maxPriceMode === 'total' ? Math.ceil(totalPrice) : Number(item.price)

        await apiClient.patch(`/admin/products/${match.id}/update-provider-price`, {
          provider_price: item.price,
          provider_max_price: providerMaxPrice,
        })
      }
    },
    onSuccess: () => {
      toast.success('Prices updated successfully')
      setSelectedCodes([])
      queryClient.invalidateQueries({ queryKey: ['products'], exact: false })
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.error || error?.message || 'Failed to update prices')
    },
  })

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <DialogTrigger asChild>
            <Button
              size="icon"
              variant="outline"
              disabled={!isSubCategoryActive}
              aria-label="Update Prices"
            >
              <RefreshCwIcon className="size-4" aria-hidden="true" />
            </Button>
          </DialogTrigger>
        </TooltipTrigger>
        <TooltipContent>Update Prices</TooltipContent>
      </Tooltip>
      <DialogContent className="w-full max-w-[94vw] md:max-w-6xl h-[90dvh] max-h-[90dvh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Update Prices from Provider</DialogTitle>
          <DialogDescription>Select provider items to sync prices.</DialogDescription>
        </DialogHeader>

        {!isSubCategoryActive ? (
          <div className="text-sm text-muted-foreground">Sub category is not active.</div>
        ) : (
          <div className="min-h-0 flex-1 grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
            <div className="min-h-0 overflow-y-auto rounded-xl border border-border/70 bg-card/50 p-3 space-y-4">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label>Provider</Label>
                  <Select value={provider} onValueChange={(v) => setProvider(v as ProductProvider)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select provider" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ProductProvider.DIGIFLAZZ}>Digiflazz</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Provider Max Price</Label>
                  <Select
                    value={maxPriceMode}
                    onValueChange={(v) => setMaxPriceMode(v as 'provider' | 'total')}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select max price" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="provider">Use Provider Price</SelectItem>
                      <SelectItem value="total">Use Total Price</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select
                    value={categoryFilter}
                    onValueChange={(value) => {
                      setCategoryFilter(value)
                      setBrandFilter('all')
                      setTypeFilter('all')
                      resetPaging()
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      {options.categories.map((item) => (
                        <SelectItem key={item} value={item}>
                          {item}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Brand</Label>
                  <Select
                    value={brandFilter}
                    onValueChange={(value) => {
                      setBrandFilter(value)
                      setTypeFilter('all')
                      resetPaging()
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All brands" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      {options.brands.map((item) => (
                        <SelectItem key={item} value={item}>
                          {item}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select
                    value={typeFilter}
                    onValueChange={(value) => {
                      setTypeFilter(value)
                      resetPaging()
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      {options.types.map((item) => (
                        <SelectItem key={item} value={item}>
                          {item}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label>Search</Label>
                  <Input
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value)
                      resetPaging()
                    }}
                  />
                </div>
                <div className="flex items-center gap-3">
                  <Switch checked={hideUnmatched} onCheckedChange={setHideUnmatched} />
                  <span className="text-sm">Hide unmatched products</span>
                </div>
              </div>
            </div>

            <div className="min-h-0 flex flex-col gap-3">
              <div className="min-h-0 flex-1 overflow-hidden">
                <div className="h-full overflow-y-auto rounded-md border border-border/70">
                  <Table>
                    <TableHeader className="sticky top-0 bg-muted/50 text-xs text-muted-foreground">
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="px-3 py-2">Select</TableHead>
                        <TableHead className="px-3 py-2">Product</TableHead>
                        <TableHead className="px-3 py-2">Category</TableHead>
                        <TableHead className="px-3 py-2">Brand</TableHead>
                        <TableHead className="px-3 py-2">Type</TableHead>
                        <TableHead className="px-3 py-2 text-right">Provider Price</TableHead>
                        <TableHead className="px-3 py-2 text-right">Match</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {providerProducts.isLoading && (
                        <TableRow>
                          <TableCell
                            colSpan={7}
                            className="px-3 py-6 text-center text-muted-foreground"
                          >
                            Loading products...
                          </TableCell>
                        </TableRow>
                      )}
                      {providerProducts.isError && (
                        <TableRow>
                          <TableCell colSpan={7} className="px-3 py-6 text-center text-red-500">
                            Failed to load provider products. Please try again later.
                          </TableCell>
                        </TableRow>
                      )}
                      {!providerProducts.isLoading && pagedProducts.length === 0 && (
                        <TableRow>
                          <TableCell
                            colSpan={7}
                            className="px-3 py-6 text-center text-muted-foreground"
                          >
                            No products found
                          </TableCell>
                        </TableRow>
                      )}
                      {pagedProducts.map((item) => {
                        const match = mapByCode.get(item.buyer_sku_code)
                        const selectable = !!match
                        return (
                          <TableRow key={item.buyer_sku_code}>
                            <TableCell className="px-3 py-2">
                              <Checkbox
                                disabled={!selectable}
                                checked={selectedSet.has(item.buyer_sku_code)}
                                onCheckedChange={() => toggleSelection(item.buyer_sku_code)}
                              />
                            </TableCell>
                            <TableCell className="px-3 py-2">
                              <p className="font-medium">{item.product_name}</p>
                              <p className="text-xs text-muted-foreground">{item.buyer_sku_code}</p>
                            </TableCell>
                            <TableCell className="px-3 py-2">{item.category}</TableCell>
                            <TableCell className="px-3 py-2">{item.brand}</TableCell>
                            <TableCell className="px-3 py-2">{item.type}</TableCell>
                            <TableCell className="px-3 py-2 text-right">
                              {Number(item.price).toLocaleString('id-ID')}
                            </TableCell>
                            <TableCell className="px-3 py-2 text-right">
                              {match ? 'Matched' : 'Unmatched'}
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>
              <div className="shrink-0 flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  Showing {(pageSafe - 1) * pageSize + 1}-
                  {Math.min(pageSafe * pageSize, sortedProducts.length)} of {sortedProducts.length}
                </span>
                <div className="flex items-center gap-2 rounded-md bg-muted/50 px-3 py-2">
                  <select
                    className="h-7 rounded-md border border-input bg-background px-2 text-xs focus-visible:border-primary/30 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/15"
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value))
                      setPage(1)
                    }}
                  >
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pageSafe <= 1}
                    onClick={() => setPage(pageSafe - 1)}
                  >
                    Prev
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pageSafe >= totalPages}
                    onClick={() => setPage(pageSafe + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
        <DialogFooter className="gap-2">
          <Button
            type="button"
            disabled={selectedCodes.length === 0 || updatePrices.isPending}
            onClick={() => updatePrices.mutate()}
          >
            {updatePrices.isPending ? 'Updating...' : `Update Selected (${selectedCodes.length})`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
