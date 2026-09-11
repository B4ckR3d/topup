import type { InferPageProps } from '@adonisjs/inertia/types'
import { useForm } from '@inertiajs/react'
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
import { type FormEvent, useState } from 'react'
import type PaymentsController from '#controllers/payments_controller'
import type { CreatePaymentMethodsValidator } from '#validators/payments'
import FileManager from '~/components/file-manager'
import { SimpleEditor } from '~/components/tiptap/tiptap-templates/simple/simple-editor'

type PaymentPreset = {
  label: string
  name: string
  provider_name: PaymentMethodProvider
  provider_code: string
  type: PaymentMethodType
  fee_type: PaymentMethodFeeType
  fee_static: number
  fee_percentage: number
  min_amount: number
  max_amount: number
  category_keyword: string
}

const PAYMENT_PRESETS: PaymentPreset[] = [
  {
    label: '⚡ KlikQRIS - QRIS Dinamis (All Payment & E-Wallet)',
    name: 'QRIS (Semua E-Wallet & Bank)',
    provider_name: PaymentMethodProvider.KLIKQRIS,
    provider_code: 'QRIS',
    type: PaymentMethodType.QR_CODE,
    fee_type: PaymentMethodFeeType.CUSTOMER,
    fee_static: 0,
    fee_percentage: 0.7,
    min_amount: 1000,
    max_amount: 10000000,
    category_keyword: 'qris',
  },
  {
    label: '⚡ Tripay - QRIS Dinamis',
    name: 'QRIS (Tripay)',
    provider_name: PaymentMethodProvider.TRIPAY,
    provider_code: 'QRIS',
    type: PaymentMethodType.QR_CODE,
    fee_type: PaymentMethodFeeType.CUSTOMER,
    fee_static: 0,
    fee_percentage: 0.7,
    min_amount: 1000,
    max_amount: 5000000,
    category_keyword: 'qris',
  },
  {
    label: '⚡ Tripay - BCA Virtual Account',
    name: 'BCA Virtual Account',
    provider_name: PaymentMethodProvider.TRIPAY,
    provider_code: 'BCAVA',
    type: PaymentMethodType.VIRTUAL_ACCOUNT,
    fee_type: PaymentMethodFeeType.CUSTOMER,
    fee_static: 4000,
    fee_percentage: 0,
    min_amount: 10000,
    max_amount: 10000000,
    category_keyword: 'virtual',
  },
  {
    label: '⚡ Tripay - BRI Virtual Account',
    name: 'BRI Virtual Account',
    provider_name: PaymentMethodProvider.TRIPAY,
    provider_code: 'BRIVA',
    type: PaymentMethodType.VIRTUAL_ACCOUNT,
    fee_type: PaymentMethodFeeType.CUSTOMER,
    fee_static: 3000,
    fee_percentage: 0,
    min_amount: 10000,
    max_amount: 10000000,
    category_keyword: 'virtual',
  },
  {
    label: '⚡ Tripay - Mandiri Virtual Account',
    name: 'Mandiri Virtual Account',
    provider_name: PaymentMethodProvider.TRIPAY,
    provider_code: 'MANDIRIVA',
    type: PaymentMethodType.VIRTUAL_ACCOUNT,
    fee_type: PaymentMethodFeeType.CUSTOMER,
    fee_static: 3500,
    fee_percentage: 0,
    min_amount: 10000,
    max_amount: 10000000,
    category_keyword: 'virtual',
  },
  {
    label: '⚡ Tripay - BNI Virtual Account',
    name: 'BNI Virtual Account',
    provider_name: PaymentMethodProvider.TRIPAY,
    provider_code: 'BNIVA',
    type: PaymentMethodType.VIRTUAL_ACCOUNT,
    fee_type: PaymentMethodFeeType.CUSTOMER,
    fee_static: 3500,
    fee_percentage: 0,
    min_amount: 10000,
    max_amount: 10000000,
    category_keyword: 'virtual',
  },
  {
    label: '⚡ Tripay - DANA (E-Wallet)',
    name: 'DANA',
    provider_name: PaymentMethodProvider.TRIPAY,
    provider_code: 'DANA',
    type: PaymentMethodType.E_WALLET,
    fee_type: PaymentMethodFeeType.CUSTOMER,
    fee_static: 0,
    fee_percentage: 1.67,
    min_amount: 1000,
    max_amount: 10000000,
    category_keyword: 'wallet',
  },
  {
    label: '⚡ Tripay - OVO (E-Wallet)',
    name: 'OVO',
    provider_name: PaymentMethodProvider.TRIPAY,
    provider_code: 'OVO',
    type: PaymentMethodType.E_WALLET,
    fee_type: PaymentMethodFeeType.CUSTOMER,
    fee_static: 0,
    fee_percentage: 1.67,
    min_amount: 1000,
    max_amount: 10000000,
    category_keyword: 'wallet',
  },
  {
    label: '⚡ Tripay - ShopeePay (E-Wallet)',
    name: 'ShopeePay',
    provider_name: PaymentMethodProvider.TRIPAY,
    provider_code: 'SHOPEEPAY',
    type: PaymentMethodType.E_WALLET,
    fee_type: PaymentMethodFeeType.CUSTOMER,
    fee_static: 0,
    fee_percentage: 1.67,
    min_amount: 1000,
    max_amount: 10000000,
    category_keyword: 'wallet',
  },
  {
    label: '⚡ Tripay - Alfamart',
    name: 'Alfamart',
    provider_name: PaymentMethodProvider.TRIPAY,
    provider_code: 'ALFAMART',
    type: PaymentMethodType.CONVENIENCE_STORE,
    fee_type: PaymentMethodFeeType.CUSTOMER,
    fee_static: 5000,
    fee_percentage: 0,
    min_amount: 10000,
    max_amount: 2500000,
    category_keyword: 'convenience',
  },
  {
    label: '⚡ Tripay - Indomaret',
    name: 'Indomaret',
    provider_name: PaymentMethodProvider.TRIPAY,
    provider_code: 'INDOMARET',
    type: PaymentMethodType.CONVENIENCE_STORE,
    fee_type: PaymentMethodFeeType.CUSTOMER,
    fee_static: 5000,
    fee_percentage: 0,
    min_amount: 10000,
    max_amount: 2500000,
    category_keyword: 'convenience',
  },
  {
    label: '⚡ Saldo Akun / Wallet Member',
    name: 'Saldo Akun',
    provider_name: PaymentMethodProvider.BALANCE,
    provider_code: 'BALANCE',
    type: PaymentMethodType.E_WALLET,
    fee_type: PaymentMethodFeeType.MERCHANT,
    fee_static: 0,
    fee_percentage: 0,
    min_amount: 0,
    max_amount: 10000000,
    category_keyword: 'wallet',
  },
]

const TRIPAY_CHANNELS = [
  { label: 'BCA VA', code: 'BCAVA', type: PaymentMethodType.VIRTUAL_ACCOUNT },
  { label: 'BRI VA', code: 'BRIVA', type: PaymentMethodType.VIRTUAL_ACCOUNT },
  { label: 'Mandiri VA', code: 'MANDIRIVA', type: PaymentMethodType.VIRTUAL_ACCOUNT },
  { label: 'BNI VA', code: 'BNIVA', type: PaymentMethodType.VIRTUAL_ACCOUNT },
  { label: 'QRIS', code: 'QRIS', type: PaymentMethodType.QR_CODE },
  { label: 'DANA', code: 'DANA', type: PaymentMethodType.E_WALLET },
  { label: 'OVO', code: 'OVO', type: PaymentMethodType.E_WALLET },
  { label: 'ShopeePay', code: 'SHOPEEPAY', type: PaymentMethodType.E_WALLET },
  { label: 'Alfamart', code: 'ALFAMART', type: PaymentMethodType.CONVENIENCE_STORE },
  { label: 'Indomaret', code: 'INDOMARET', type: PaymentMethodType.CONVENIENCE_STORE },
]

const DUITKU_CHANNELS = [
  { label: 'BCA VA (BC)', code: 'BC', type: PaymentMethodType.VIRTUAL_ACCOUNT },
  { label: 'Mandiri VA (M2)', code: 'M2', type: PaymentMethodType.VIRTUAL_ACCOUNT },
  { label: 'Maybank VA (VA)', code: 'VA', type: PaymentMethodType.VIRTUAL_ACCOUNT },
  { label: 'Permata VA (BT)', code: 'BT', type: PaymentMethodType.VIRTUAL_ACCOUNT },
  { label: 'CIMB VA (B1)', code: 'B1', type: PaymentMethodType.VIRTUAL_ACCOUNT },
  { label: 'OVO (OV)', code: 'OV', type: PaymentMethodType.E_WALLET },
  { label: 'DANA (DA)', code: 'DA', type: PaymentMethodType.E_WALLET },
  { label: 'ShopeePay (SP)', code: 'SP', type: PaymentMethodType.E_WALLET },
]

export function AddPaymentMethodModal({ categories }: Props) {
  const [open, setOpen] = useState(false)
  const form = useForm<CreatePaymentMethodsValidator>({
    name: '',
    payment_method_category_id: '',
    image_id: '',
    fee_static: 0,
    fee_percentage: 0,
    fee_type: PaymentMethodFeeType.MERCHANT,
    is_available: true,
    is_featured: false,
    label: '',
    provider_name: PaymentMethodProvider.KLIKQRIS,
    provider_code: 'QRIS',
    min_amount: 1000,
    max_amount: 10000000,
    type: PaymentMethodType.QR_CODE,
    allow_access: [],
    expired_in: 0,
    cut_off_start: '00:00',
    cut_off_end: '00:00',
    is_need_phone_number: false,
    is_need_email: false,
    instruction: '',
  })

  const applyPreset = (preset: PaymentPreset) => {
    let matchedCategoryId = form.data.payment_method_category_id
    if (preset.category_keyword && categories?.length) {
      const found = categories.find((c) =>
        c.name.toLowerCase().includes(preset.category_keyword.toLowerCase()),
      )
      if (found) matchedCategoryId = found.id
    }

    form.setData({
      ...form.data,
      name: preset.name,
      provider_name: preset.provider_name,
      provider_code: preset.provider_code,
      type: preset.type,
      fee_type: preset.fee_type,
      fee_static: preset.fee_static,
      fee_percentage: preset.fee_percentage,
      min_amount: preset.min_amount,
      max_amount: preset.max_amount,
      payment_method_category_id: matchedCategoryId || form.data.payment_method_category_id,
      is_available: true,
    })
  }

  const handleProviderChange = (p: PaymentMethodProvider) => {
    form.setData((prev) => {
      const next = { ...prev, provider_name: p }
      if (p === PaymentMethodProvider.KLIKQRIS) {
        next.type = PaymentMethodType.QR_CODE
        next.provider_code = 'QRIS'
        if (!next.name) next.name = 'QRIS (Semua E-Wallet & Bank)'
        const qrisCat = categories?.find(
          (c) => c.name.toLowerCase().includes('qris') || c.name.toLowerCase().includes('wallet'),
        )
        if (qrisCat && !next.payment_method_category_id) {
          next.payment_method_category_id = qrisCat.id
        }
      } else if (p === PaymentMethodProvider.BALANCE) {
        next.type = PaymentMethodType.E_WALLET
        next.provider_code = 'BALANCE'
        if (!next.name) next.name = 'Saldo Akun'
        next.fee_static = 0
        next.fee_percentage = 0
      }
      return next
    })
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    form.post('/admin/payments/methods', {
      onSuccess: () => {
        setOpen(false)
        form.reset()
      },
    })
  }

  const isKlikQris = form.data.provider_name === PaymentMethodProvider.KLIKQRIS

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">Add New</Button>
      </DialogTrigger>
      <DialogContent className="lg:min-w-3/5 ">
        <DialogHeader>
          <DialogTitle>Add Payment Method</DialogTitle>
        </DialogHeader>
        <form className="space-y-4 max-h-96 overflow-y-auto">
          {/* Quick Presets */}
          <div className="rounded-xl border border-primary/25 bg-primary/5 p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold text-primary flex items-center gap-1.5">
                <span>⚡ Quick Preset Siap Pakai (1-Klik Otomatis)</span>
              </Label>
              <span className="text-[11px] text-muted-foreground">
                Otomatis isi nama, kode, tipe & fee
              </span>
            </div>
            <Select
              onValueChange={(val) => {
                const p = PAYMENT_PRESETS.find((preset) => preset.label === val)
                if (p) applyPreset(p)
              }}
            >
              <SelectTrigger className="w-full bg-background text-xs h-9">
                <SelectValue placeholder="Pilih preset (KlikQRIS, Tripay VA, E-Wallet, Saldo, dll)..." />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_PRESETS.map((p) => (
                  <SelectItem key={p.label} value={p.label} className="text-xs">
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="image_id" className="mb-2">
              Image
            </Label>
            <FileManager onFilesSelected={(f) => form.setData('image_id', f.id)} />
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
                {categories?.map((cat) => (
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
              <div className="flex items-center justify-between mb-2">
                <Label htmlFor="type">Type</Label>
                {isKlikQris && (
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-500/10 px-1.5 py-0.5 rounded">
                    Khusus QR Code
                  </span>
                )}
              </div>
              <Select
                value={isKlikQris ? PaymentMethodType.QR_CODE : form.data.type}
                onValueChange={(v) => form.setData('type', v as PaymentMethodType)}
                disabled={isKlikQris}
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
                  onValueChange={(v) => handleProviderChange(v as PaymentMethodProvider)}
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
                  {isKlikQris && (
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-500/10 px-1.5 py-0.5 rounded">
                      Terkunci: QRIS
                    </span>
                  )}
                </div>
                <Input
                  id="provider_code"
                  placeholder="Provider Code"
                  value={isKlikQris ? 'QRIS' : form.data.provider_code}
                  onChange={(e) => form.setData('provider_code', e.target.value)}
                  disabled={isKlikQris}
                  required
                />
                {form.errors.provider_code && (
                  <div className="text-red-500 text-xs mt-1">{form.errors.provider_code}</div>
                )}
              </div>
            </div>

            {/* Smart Hints & Shortcut Pills */}
            {isKlikQris && (
              <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 text-xs text-emerald-700 dark:text-emerald-300">
                ✨ <strong>KlikQRIS Otomatis:</strong> KlikQRIS hanya melayani pembayaran via QRIS
                dinamis. Tipe otomatis diset ke <code>qr_code</code> dan Provider Code otomatis
                diset ke <code>QRIS</code>.
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
              <div className="text-red-500 text-xs mt-1">{form.errors.is_need_phone_number}</div>
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
                <Label key={a} className="flex items-center gap-1" htmlFor={`allow_access_${a}`}>
                  <input
                    id={`allow_access_${a}`}
                    type="checkbox"
                    checked={form.data.allow_access.includes(a)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        form.setData('allow_access', [
                          ...form.data.allow_access,
                          a as PaymentMethodAllowAccess,
                        ])
                      } else {
                        form.setData(
                          'allow_access',
                          form.data.allow_access.filter((val) => val !== a),
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
                value={form.data.instruction}
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
      </DialogContent>
    </Dialog>
  )
}
