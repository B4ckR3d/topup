import { useForm } from '@inertiajs/react'
import { useMutation } from '@tanstack/react-query'
import {
  PaymentMethodAllowAccess,
  PaymentMethodFeeType,
  PaymentMethodProvider,
  PaymentMethodType,
} from '@umbreon/db/types'
import { Button } from '@umbreon/ui/components/ui/button'
import {
  Dialog,
  DialogContent,
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
import { type FormEvent, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import type { UpdatePaymentMethodsValidator } from '#validators/payments'
import FileManager from '~/components/file-manager'
import { SimpleEditor } from '~/components/tiptap/tiptap-templates/simple/simple-editor'
import { apiClient } from '~/utils/axios'

type Props = {
  paymentMethodId: string
}

const TRIPAY_CHANNELS = [
  { code: 'QRIS', label: 'Tripay QRIS', type: PaymentMethodType.QR_CODE },
  { code: 'BCAVA', label: 'BCA Virtual Account', type: PaymentMethodType.VIRTUAL_ACCOUNT },
  { code: 'BNIVA', label: 'BNI Virtual Account', type: PaymentMethodType.VIRTUAL_ACCOUNT },
  { code: 'BRIVA', label: 'BRI Virtual Account', type: PaymentMethodType.VIRTUAL_ACCOUNT },
  { code: 'MANDIRIVA', label: 'Mandiri Virtual Account', type: PaymentMethodType.VIRTUAL_ACCOUNT },
  { code: 'PERMATAVA', label: 'Permata Virtual Account', type: PaymentMethodType.VIRTUAL_ACCOUNT },
  { code: 'CIMBVA', label: 'CIMB Niaga VA', type: PaymentMethodType.VIRTUAL_ACCOUNT },
  { code: 'BSIVA', label: 'BSI Virtual Account', type: PaymentMethodType.VIRTUAL_ACCOUNT },
  { code: 'OVO', label: 'OVO (Tripay)', type: PaymentMethodType.E_WALLET },
  { code: 'SHOPEEPAY', label: 'ShopeePay (Tripay)', type: PaymentMethodType.E_WALLET },
  { code: 'ALFAMART', label: 'Alfamart', type: PaymentMethodType.CONVENIENCE_STORE },
  { code: 'INDOMARET', label: 'Indomaret', type: PaymentMethodType.CONVENIENCE_STORE },
]

const DUITKU_CHANNELS = [
  { code: 'SP', label: 'Duitku QRIS (ShopeePay / Semua)', type: PaymentMethodType.QR_CODE },
  { code: 'BC', label: 'BCA Virtual Account (Duitku)', type: PaymentMethodType.VIRTUAL_ACCOUNT },
  {
    code: 'M2',
    label: 'Mandiri Virtual Account (Duitku)',
    type: PaymentMethodType.VIRTUAL_ACCOUNT,
  },
  { code: 'I1', label: 'BNI Virtual Account (Duitku)', type: PaymentMethodType.VIRTUAL_ACCOUNT },
  { code: 'BR', label: 'BRI Virtual Account (Duitku)', type: PaymentMethodType.VIRTUAL_ACCOUNT },
  { code: 'BT', label: 'Permata VA (Duitku)', type: PaymentMethodType.VIRTUAL_ACCOUNT },
  { code: 'B1', label: 'CIMB Niaga VA (Duitku)', type: PaymentMethodType.VIRTUAL_ACCOUNT },
  { code: 'DA', label: 'DANA (Duitku E-Wallet)', type: PaymentMethodType.E_WALLET },
  { code: 'OV', label: 'OVO (Duitku E-Wallet)', type: PaymentMethodType.E_WALLET },
  { code: 'SA', label: 'ShopeePay (Duitku E-Wallet)', type: PaymentMethodType.E_WALLET },
  { code: 'A1', label: 'Alfamart (Duitku Retail)', type: PaymentMethodType.CONVENIENCE_STORE },
  { code: 'IR', label: 'Indomaret (Duitku Retail)', type: PaymentMethodType.CONVENIENCE_STORE },
]

export function EditPaymentMethodModal({ paymentMethodId }: Props) {
  const [open, setOpen] = useState(false)
  const [gatewayStatus, setGatewayStatus] = useState<
    Record<string, { status: string; message: string }>
  >({})
  const [isLoadingGateway, setIsLoadingGateway] = useState(false)

  const form = useForm<UpdatePaymentMethodsValidator>({
    name: '',
    image_id: '',
    fee_static: 0,
    fee_percentage: 0,
    fee_type: PaymentMethodFeeType.BUYER,
    is_available: false,
    is_featured: false,
    label: '',
    provider_name: PaymentMethodProvider.TRIPAY,
    provider_code: '',
    min_amount: 0,
    max_amount: 0,
    type: PaymentMethodType.VIRTUAL_ACCOUNT,
    allow_access: [] as PaymentMethodAllowAccess[],
    expired_in: 0,
    cut_off_start: '00:00',
    cut_off_end: '00:00',
    is_need_phone_number: false,
    is_need_email: false,
  })

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()

    if (!form.data.name || !form.data.name.trim()) {
      toast.error('Nama Metode Pembayaran wajib diisi!')
      return
    }

    if (!form.data.provider_code || !form.data.provider_code.trim()) {
      toast.error('Provider Code wajib diisi!')
      return
    }

    if (
      form.data.max_amount !== undefined &&
      form.data.min_amount !== undefined &&
      form.data.max_amount > 0 &&
      form.data.min_amount > form.data.max_amount
    ) {
      toast.error('Minimal pembayaran tidak boleh lebih besar dari Maksimal pembayaran!')
      return
    }

    form.patch(`/admin/payments/methods/${paymentMethodId}`, {
      onSuccess: () => {
        toast.success('Metode pembayaran berhasil diperbarui!')
        setOpen(false)
        form.reset()
      },
      onError: (errors) => {
        console.error('[EditPaymentMethodModal] Errors:', errors)
        const errList = Object.entries(errors)
          .map(([key, msg]) => `${key}: ${msg}`)
          .filter(Boolean)

        if (errList.length > 0) {
          toast.error(`Gagal menyimpan perubahan:\n${errList.join('\n')}`, { duration: 6000 })
        } else {
          toast.error('Gagal memperbarui metode pembayaran. Mohon periksa kelengkapan form.')
        }
      },
    })
  }

  const getPaymentMethod = useMutation({
    mutationKey: ['getPaymentMethod', paymentMethodId],
    mutationFn: async () =>
      apiClient.get(`/admin/payments/methods/${paymentMethodId}`).then((res) => {
        const d = res.data.data
        form.setData({
          name: d.name,
          allow_access: d.allow_access,
          image_id: d.image_id || '',
          fee_static: d.fee_static,
          fee_percentage: d.fee_percentage,
          fee_type: d.fee_type,
          cut_off_end: d.cut_off_end || '00:00',
          cut_off_start: d.cut_off_start || '00:00',
          is_available: d.is_available,
          is_featured: d.is_featured,
          expired_in: d.expired_in,
          is_need_email: d.is_need_email,
          is_need_phone_number: d.is_need_phone_number,
          label: d.label || '',
          max_amount: d.max_amount,
          min_amount: d.min_amount,
          payment_method_category_id: d.payment_method_category_id,
          provider_code: d.provider_code || '',
          provider_name: d.provider_name,
          type: d.type,
          instruction: d.instruction || '<p>Instructions</p>',
        })
        return res.data
      }),
  })

  useEffect(() => {
    if (!open) return
    getPaymentMethod.mutate()

    setIsLoadingGateway(true)
    apiClient
      .get<{ success: boolean; gateways: Array<{ id: string; status: string; message: string }> }>(
        '/admin/gateways/test-all',
      )
      .then((res) => {
        if (res.data?.gateways) {
          const map: Record<string, { status: string; message: string }> = {}
          res.data.gateways.forEach((g) => {
            map[g.id] = { status: g.status, message: g.message }
          })
          setGatewayStatus(map)
        }
      })
      .catch(() => {})
      .finally(() => {
        setIsLoadingGateway(false)
      })
  }, [open, paymentMethodId])

  const getProviderStatus = () => {
    const p = form.data.provider_name
    if (p === PaymentMethodProvider.BALANCE) {
      return { status: 'connected', message: 'Sistem Saldo Internal (Otomatis & Siap Dipakai)' }
    }
    if (p === PaymentMethodProvider.MANUAL) {
      return { status: 'connected', message: 'Metode Manual (Konfirmasi Admin)' }
    }
    return p ? gatewayStatus[p] : undefined
  }
  const currentProviderStatus = getProviderStatus()
  const isKlikQris = form.data.provider_name === PaymentMethodProvider.KLIKQRIS

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          Edit
        </Button>
      </DialogTrigger>
      <DialogContent className="lg:min-w-3/5 ">
        <DialogHeader>
          <DialogTitle>Edit Payment Method</DialogTitle>
        </DialogHeader>
        {getPaymentMethod.isPending && <p className="text-center">Loading....</p>}
        {getPaymentMethod.isError && (
          <p className="text-red-500 text-center">Failed to load payment method</p>
        )}
        {getPaymentMethod.isSuccess && (
          <>
            <form className="space-y-4 max-h-96 overflow-y-auto">
              <div>
                <Label htmlFor="image_id" className="mb-2">
                  Image
                </Label>
                <FileManager
                  onFilesSelected={(f) => form.setData('image_id', f.id)}
                  defaultFileId={getPaymentMethod.data.data.image_id}
                />
                {form.errors.image_id && (
                  <div className="text-red-500 text-xs mt-1">{form.errors.image_id}</div>
                )}
              </div>
              <div>
                <Label htmlFor="name" className="mb-2">
                  Name
                </Label>
                <Input
                  id="name"
                  placeholder="Name"
                  value={form.data.name}
                  onChange={(e) => form.setData('name', e.target.value)}
                  required
                />
                {form.errors.name && (
                  <div className="text-red-500 text-xs mt-1">{form.errors.name}</div>
                )}
              </div>
              <div>
                <Label htmlFor="category" className="mb-2">
                  Category
                </Label>
                <Select
                  value={form.data.payment_method_category_id}
                  onValueChange={(v) => form.setData('payment_method_category_id', v)}
                  required
                >
                  <SelectTrigger className="w-full" id="category">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {getPaymentMethod.data.categories?.map((cat: any) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.errors.payment_method_category_id && (
                  <div className="text-red-500 text-xs mt-1">
                    {form.errors.payment_method_category_id}
                  </div>
                )}
              </div>

              {/* Fee Static & Fee Percentage */}
              <div className="flex gap-4">
                <div className="flex-1">
                  <Label htmlFor="fee_static" className="mb-2">
                    Fee Static
                  </Label>
                  <Input
                    id="fee_static"
                    type="number"
                    placeholder="Fee Static"
                    value={form.data.fee_static}
                    onChange={(e) => form.setData('fee_static', Number(e.target.value))}
                    required
                  />
                  {form.errors.fee_static && (
                    <div className="text-red-500 text-xs mt-1">{form.errors.fee_static}</div>
                  )}
                </div>
                <div className="flex-1">
                  <Label htmlFor="fee_percentage" className="mb-2">
                    Fee Percentage
                  </Label>
                  <Input
                    id="fee_percentage"
                    type="number"
                    placeholder="Fee Percentage"
                    value={form.data.fee_percentage}
                    onChange={(e) => form.setData('fee_percentage', Number(e.target.value))}
                    required
                  />
                  {form.errors.fee_percentage && (
                    <div className="text-red-500 text-xs mt-1">{form.errors.fee_percentage}</div>
                  )}
                </div>
              </div>

              {/* Fee Type & Type */}
              <div className="flex gap-4">
                <div className="flex-1">
                  <Label htmlFor="fee_type" className="mb-2">
                    Fee Type
                  </Label>
                  <Select
                    value={form.data.fee_type}
                    onValueChange={(v) => form.setData('fee_type', v as PaymentMethodFeeType)}
                    required
                  >
                    <SelectTrigger className="w-full" id="fee_type">
                      <SelectValue placeholder="Fee Type" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(PaymentMethodFeeType).map((ft) => (
                        <SelectItem key={ft} value={ft}>
                          {ft}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {form.errors.fee_type && (
                    <div className="text-red-500 text-xs mt-1">{form.errors.fee_type}</div>
                  )}
                </div>
                <div className="flex-1">
                  <Label htmlFor="type" className="mb-2">
                    Type
                  </Label>
                  <Select
                    value={form.data.type}
                    onValueChange={(v) => form.setData('type', v as PaymentMethodType)}
                    required
                  >
                    <SelectTrigger className="w-full" id="type">
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(PaymentMethodType).map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {form.errors.type && (
                    <div className="text-red-500 text-xs mt-1">{form.errors.type}</div>
                  )}
                </div>
              </div>

              {/* Provider Name & Provider Code */}
              <div className="space-y-3">
                <div className="flex gap-4">
                  <div className="flex-1">
                    <Label htmlFor="provider_name" className="mb-2">
                      Provider Name
                    </Label>
                    <Select
                      value={form.data.provider_name}
                      onValueChange={(v) => {
                        const p = v as PaymentMethodProvider
                        form.setData((prev) => {
                          const next = { ...prev, provider_name: p }
                          if (p === PaymentMethodProvider.KLIKQRIS) {
                            next.type = PaymentMethodType.QR_CODE
                            next.provider_code = 'QRIS'
                          } else if (p === PaymentMethodProvider.BALANCE) {
                            next.type = PaymentMethodType.E_WALLET
                            next.provider_code = 'BALANCE'
                          }
                          return next
                        })
                      }}
                      required
                    >
                      <SelectTrigger className="w-full" id="provider_name">
                        <SelectValue placeholder="Provider Name" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.values(PaymentMethodProvider).map((p) => (
                          <SelectItem key={p} value={p}>
                            {p}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {form.errors.provider_name && (
                      <div className="text-red-500 text-xs mt-1">{form.errors.provider_name}</div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <Label htmlFor="provider_code">Provider Code</Label>
                      {form.data.provider_name === PaymentMethodProvider.KLIKQRIS && (
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-500/10 px-1.5 py-0.5 rounded">
                          Terkunci: QRIS
                        </span>
                      )}
                    </div>
                    <Input
                      id="provider_code"
                      placeholder="Provider Code"
                      value={
                        form.data.provider_name === PaymentMethodProvider.KLIKQRIS
                          ? 'QRIS'
                          : form.data.provider_code
                      }
                      onChange={(e) => form.setData('provider_code', e.target.value)}
                      disabled={form.data.provider_name === PaymentMethodProvider.KLIKQRIS}
                      required
                    />
                    {form.errors.provider_code && (
                      <div className="text-red-500 text-xs mt-1">{form.errors.provider_code}</div>
                    )}
                  </div>
                </div>

                {/* Live Gateway Connectivity Status */}
                {isLoadingGateway ? (
                  <div className="rounded-lg border border-border/60 bg-muted/40 px-3 py-2.5 text-xs flex items-center gap-2 animate-pulse text-muted-foreground">
                    <span className="h-2 w-2 rounded-full bg-primary/60 animate-ping" />
                    <span>Memeriksa status koneksi gateway {form.data.provider_name}...</span>
                  </div>
                ) : currentProviderStatus ? (
                  <div
                    className={`rounded-lg px-3 py-2.5 text-xs flex items-center justify-between border transition-all ${
                      currentProviderStatus.status === 'connected'
                        ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                        : currentProviderStatus.status === 'not_configured'
                          ? 'border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300'
                          : 'border-red-500/40 bg-red-500/10 text-red-700 dark:text-red-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-base">
                        {currentProviderStatus.status === 'connected'
                          ? '🟢'
                          : currentProviderStatus.status === 'not_configured'
                            ? '🟡'
                            : '🔴'}
                      </span>
                      <div>
                        <div className="font-semibold flex items-center gap-1.5">
                          <span>Gateway {form.data.provider_name?.toUpperCase()}:</span>
                          <span>
                            {currentProviderStatus.status === 'connected'
                              ? 'Terkoneksi & Siap Pakai'
                              : currentProviderStatus.status === 'not_configured'
                                ? 'Belum Dikonfigurasi di .env'
                                : 'Error / Gangguan'}
                          </span>
                        </div>
                        <div className="text-[11px] opacity-85 mt-0.5">
                          {currentProviderStatus.message}
                        </div>
                      </div>
                    </div>
                    <span
                      className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full border ${
                        currentProviderStatus.status === 'connected'
                          ? 'border-emerald-500/40 bg-emerald-500/20 text-emerald-800 dark:text-emerald-200'
                          : currentProviderStatus.status === 'not_configured'
                            ? 'border-amber-500/40 bg-amber-500/20 text-amber-800 dark:text-amber-200'
                            : 'border-red-500/40 bg-red-500/20 text-red-800 dark:text-red-200'
                      }`}
                    >
                      {currentProviderStatus.status}
                    </span>
                  </div>
                ) : null}

                {/* Smart Hints & Shortcut Pills */}
                {isKlikQris && (
                  <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 text-xs text-emerald-700 dark:text-emerald-300">
                    ✨ <strong>KlikQRIS Otomatis:</strong> Hanya melayani QRIS dinamis (Type
                    otomatis <code>qr_code</code> & Kode Provider <code>QRIS</code>).
                  </div>
                )}

                {form.data.provider_name === PaymentMethodProvider.TRIPAY && (
                  <div className="space-y-1.5 rounded-lg border border-border bg-muted/40 p-2.5">
                    <p className="text-[11px] font-medium text-muted-foreground">
                      Pilih Shortcut Channel Tripay (Klik untuk auto-fill):
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {TRIPAY_CHANNELS.map((ch) => (
                        <button
                          key={ch.code}
                          type="button"
                          onClick={() => {
                            form.setData((prev) => ({
                              ...prev,
                              provider_code: ch.code,
                              type: ch.type,
                              name: prev.name ? prev.name : ch.label,
                            }))
                          }}
                          className={`text-xs px-2 py-1 rounded transition-colors border ${
                            form.data.provider_code === ch.code
                              ? 'bg-primary text-primary-foreground border-primary'
                              : 'bg-background hover:bg-secondary border-border text-foreground'
                          }`}
                        >
                          {ch.label} ({ch.code})
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {form.data.provider_name === PaymentMethodProvider.DUITKU && (
                  <div className="space-y-1.5 rounded-lg border border-border bg-muted/40 p-2.5">
                    <p className="text-[11px] font-medium text-muted-foreground">
                      Pilih Shortcut Channel Duitku (Klik untuk auto-fill):
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {DUITKU_CHANNELS.map((ch) => (
                        <button
                          key={ch.code}
                          type="button"
                          onClick={() => {
                            form.setData((prev) => ({
                              ...prev,
                              provider_code: ch.code,
                              type: ch.type,
                              name: prev.name ? prev.name : ch.label,
                            }))
                          }}
                          className={`text-xs px-2 py-1 rounded transition-colors border ${
                            form.data.provider_code === ch.code
                              ? 'bg-primary text-primary-foreground border-primary'
                              : 'bg-background hover:bg-secondary border-border text-foreground'
                          }`}
                        >
                          {ch.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Min Amount & Max Amount */}
              <div className="flex gap-4">
                <div className="flex-1">
                  <Label htmlFor="min_amount" className="mb-2">
                    Min Amount
                  </Label>
                  <Input
                    id="min_amount"
                    type="number"
                    placeholder="Min Amount"
                    value={form.data.min_amount}
                    onChange={(e) => form.setData('min_amount', Number(e.target.value))}
                    required
                  />
                  {form.errors.min_amount && (
                    <div className="text-red-500 text-xs mt-1">{form.errors.min_amount}</div>
                  )}
                </div>
                <div className="flex-1">
                  <Label htmlFor="max_amount" className="mb-2">
                    Max Amount
                  </Label>
                  <Input
                    id="max_amount"
                    type="number"
                    placeholder="Max Amount"
                    value={form.data.max_amount}
                    onChange={(e) => form.setData('max_amount', Number(e.target.value))}
                    required
                  />
                  {form.errors.max_amount && (
                    <div className="text-red-500 text-xs mt-1">{form.errors.max_amount}</div>
                  )}
                </div>
              </div>

              {/* Status & Options */}
              <div className="flex flex-wrap gap-4 items-center">
                <Label className="flex items-center gap-1" htmlFor="is_available">
                  <input
                    id="is_available"
                    type="checkbox"
                    checked={form.data.is_available}
                    onChange={(e) => form.setData('is_available', e.target.checked)}
                  />
                  Available
                </Label>
                <Label className="flex items-center gap-1" htmlFor="is_featured">
                  <input
                    id="is_featured"
                    type="checkbox"
                    checked={form.data.is_featured}
                    onChange={(e) => form.setData('is_featured', e.target.checked)}
                  />
                  Featured
                </Label>
                <Label className="flex items-center gap-1" htmlFor="is_need_phone_number">
                  <input
                    id="is_need_phone_number"
                    type="checkbox"
                    checked={form.data.is_need_phone_number}
                    onChange={(e) => form.setData('is_need_phone_number', e.target.checked)}
                  />
                  Need Phone Number
                </Label>
                <Label className="flex items-center gap-1" htmlFor="is_need_email">
                  <input
                    id="is_need_email"
                    type="checkbox"
                    checked={form.data.is_need_email}
                    onChange={(e) => form.setData('is_need_email', e.target.checked)}
                  />
                  Need Email
                </Label>
                {form.errors.is_available && (
                  <div className="text-red-500 text-xs mt-1">{form.errors.is_available}</div>
                )}
                {form.errors.is_featured && (
                  <div className="text-red-500 text-xs mt-1">{form.errors.is_featured}</div>
                )}
                {form.errors.is_need_phone_number && (
                  <div className="text-red-500 text-xs mt-1">
                    {form.errors.is_need_phone_number}
                  </div>
                )}
                {form.errors.is_need_email && (
                  <div className="text-red-500 text-xs mt-1">{form.errors.is_need_email}</div>
                )}
              </div>

              {/* Allow Access */}
              <div>
                <Label className="block mb-2">Allow Access</Label>
                <div className="flex flex-wrap gap-2">
                  {Object.values(PaymentMethodAllowAccess).map((a) => (
                    <Label
                      key={a}
                      className="flex items-center gap-1"
                      htmlFor={`allow_access_${a}`}
                    >
                      <input
                        id={`allow_access_${a}`}
                        type="checkbox"
                        checked={(form.data.allow_access ?? []).includes(a)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            form.setData('allow_access', [
                              ...(form.data.allow_access ?? []),
                              a as PaymentMethodAllowAccess,
                            ])
                          } else {
                            form.setData(
                              'allow_access',
                              (form.data.allow_access ?? []).filter((val) => val !== a),
                            )
                          }
                        }}
                      />
                      {a}
                    </Label>
                  ))}
                </div>
                {form.errors.allow_access && (
                  <div className="text-red-500 text-xs mt-1">{form.errors.allow_access}</div>
                )}
              </div>

              <div>
                <Label htmlFor="expired_in" className="mb-2">
                  Expired In (seconds)
                </Label>
                <Input
                  id="expired_in"
                  type="number"
                  placeholder="Expired In"
                  value={form.data.expired_in}
                  onChange={(e) => form.setData('expired_in', Number(e.target.value))}
                  required
                />
                {form.errors.expired_in && (
                  <div className="text-red-500 text-xs mt-1">{form.errors.expired_in}</div>
                )}
              </div>

              {/* Cut Off Start & End */}
              <div className="flex gap-4">
                <div className="flex-1">
                  <Label htmlFor="cut_off_start" className="mb-2">
                    Cut Off Start
                  </Label>
                  <Input
                    id="cut_off_start"
                    type="time"
                    placeholder="Cut Off Start"
                    value={form.data.cut_off_start}
                    onChange={(e) => form.setData('cut_off_start', e.target.value)}
                  />
                  {form.errors.cut_off_start && (
                    <div className="text-red-500 text-xs mt-1">{form.errors.cut_off_start}</div>
                  )}
                </div>
                <div className="flex-1">
                  <Label htmlFor="cut_off_end" className="mb-2">
                    Cut Off End
                  </Label>
                  <Input
                    id="cut_off_end"
                    type="time"
                    placeholder="Cut Off End"
                    value={form.data.cut_off_end}
                    onChange={(e) => form.setData('cut_off_end', e.target.value)}
                  />
                  {form.errors.cut_off_end && (
                    <div className="text-red-500 text-xs mt-1">{form.errors.cut_off_end}</div>
                  )}
                </div>
              </div>

              {/* Instruction */}
              <div className="flex gap-4">
                <div className="flex-1">
                  <Label htmlFor="instruction" className="mb-2">
                    Instruction
                  </Label>
                  <SimpleEditor
                    value={form.data.instruction || ''}
                    onChange={(val) => form.setData('instruction', val)}
                  />
                  {form.errors.instruction && (
                    <div className="text-red-500 text-xs mt-1">{form.errors.instruction}</div>
                  )}
                </div>
              </div>
            </form>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} type="submit" size="sm" disabled={form.processing}>
                {form.processing ? 'Saving...' : 'Save'}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
