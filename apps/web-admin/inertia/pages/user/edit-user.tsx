import { router, useForm } from '@inertiajs/react'
import { UserRegisteredType, UserRole } from '@umbreon/db/types'
import { Button } from '@umbreon/ui/components/ui/button'
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
  Check,
  Copy,
  KeyRound,
  PencilIcon,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react'
import { useState } from 'react'
import toast from 'react-hot-toast'
import type { UpdateUserValidator } from '#validators/user'
import { apiClient } from '~/utils/axios'

type Props = {
  user: UpdateUserValidator & {
    id: string
    two_factor_enabled?: boolean | null
    two_factor_secret?: string | null
    two_factor_confirmed_at?: string | null
  }
}

export default function EditUserModal({ user }: Props) {
  const [open, setOpen] = useState(false)
  const [isSettingUp2Fa, setIsSettingUp2Fa] = useState(false)
  const [generated2Fa, setGenerated2Fa] = useState<{
    secret: string
    otpAuthUrl: string
    recoveryCodes: string[]
  } | null>(null)
  const [verifyOtpCode, setVerifyOtpCode] = useState('')
  const [isCopied, setIsCopied] = useState(false)
  const [is2FaLoading, setIs2FaLoading] = useState(false)

  const is2FaEnabled = !!user.two_factor_enabled

  const { data, errors, setData, patch, processing } = useForm<UpdateUserValidator>({
    name: user.name ?? '',
    email: user.email ?? '',
    password: '',
    phone: user.phone ?? '',
    role: user.role ?? UserRole.USER,
    is_banned: user.is_banned ?? false,
    is_email_verified: user.is_email_verified ?? false,
    registered_type: user.registered_type ?? UserRegisteredType.LOCAL,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    patch(`/admin/users/${user.id}`, {
      onSuccess: () => {
        setOpen(false)
        toast.success('Data user berhasil diperbarui.')
      },
      onError: (errs) => {
        console.error(errs)
        toast.error('Gagal memperbarui user.')
      },
    })
  }

  // Generate 2FA Secret Key
  const handleGenerate2Fa = async () => {
    setIs2FaLoading(true)
    try {
      const res = await apiClient.get(`/admin/users/${user.id}/2fa/generate`)
      if (res.data && res.data.secret) {
        setGenerated2Fa(res.data)
        setIsSettingUp2Fa(true)
        toast.success('Secret key 2FA baru berhasil dibuat.')
      } else {
        toast.error(res.data?.error || 'Gagal membuat secret key 2FA')
      }
    } catch (err: any) {
      console.error('[2FA Setup Error]:', err)
      toast.error(
        err?.response?.data?.error || err?.message || 'Terjadi kesalahan koneksi saat membuat 2FA.',
      )
    } finally {
      setIs2FaLoading(false)
    }
  }

  // Verify and Enable 2FA
  const handleEnable2Fa = () => {
    if (!generated2Fa || !verifyOtpCode.trim()) {
      toast.error('Masukkan 6-digit kode OTP dari Authenticator.')
      return
    }

    router.post(
      `/admin/users/${user.id}/2fa/enable`,
      {
        secret: generated2Fa.secret,
        code: verifyOtpCode.trim(),
        recoveryCodes: generated2Fa.recoveryCodes,
      },
      {
        onSuccess: () => {
          setIsSettingUp2Fa(false)
          setGenerated2Fa(null)
          setVerifyOtpCode('')
          toast.success('2FA berhasil diaktifkan untuk user ini!')
        },
        onError: (errs: any) => {
          toast.error(errs.error || 'Kode OTP tidak valid.')
        },
      },
    )
  }

  // Disable / Reset 2FA
  const handleDisable2Fa = () => {
    if (!confirm('Apakah Anda yakin ingin menonaktifkan 2FA untuk user ini?')) return

    router.post(
      `/admin/users/${user.id}/2fa/disable`,
      {},
      {
        onSuccess: () => {
          setIsSettingUp2Fa(false)
          setGenerated2Fa(null)
          toast.success('2FA dinonaktifkan untuk user ini.')
        },
        onError: () => {
          toast.error('Gagal menonaktifkan 2FA.')
        },
      },
    )
  }

  const handleCopySecret = (text: string) => {
    navigator.clipboard?.writeText(text)
    setIsCopied(true)
    toast.success('Secret key disalin ke clipboard!')
    setTimeout(() => setIsCopied(false), 2000)
  }

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger asChild>
        <button className="flex justify-start items-center text-sm p-2 hover:bg-primary/10 w-full rounded-md cursor-pointer">
          <PencilIcon className="h-4 w-4 mr-2" />
          Edit
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-start font-bold text-lg">
            Edit User: {user.name || user.email}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Kelola data profil, izin role, dan status keamanan Two-Factor Authentication (2FA).
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4 my-2" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name" className="mb-1 text-xs">
                Nama Lengkap
              </Label>
              <Input
                id="name"
                type="text"
                value={data.name}
                onChange={(e) => setData('name', e.target.value)}
              />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
            </div>
            <div>
              <Label htmlFor="email" className="mb-1 text-xs">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={data.email}
                onChange={(e) => setData('email', e.target.value)}
              />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="phone" className="mb-1 text-xs">
                Nomor Telepon
              </Label>
              <Input
                id="phone"
                type="text"
                value={data.phone}
                onChange={(e) => setData('phone', e.target.value)}
              />
              {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
            </div>
            <div>
              <Label htmlFor="password" className="mb-1 text-xs">
                Password Baru (Opsional)
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Kosongkan jika tidak diubah"
                value={data.password}
                onChange={(e) => setData('password', e.target.value)}
              />
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="mb-1 text-xs">Tipe Pendaftaran</Label>
              <Select
                value={data.registered_type}
                onValueChange={(value) => setData('registered_type', value as UserRegisteredType)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="User Registered Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={UserRegisteredType.LOCAL}>Local</SelectItem>
                  <SelectItem value={UserRegisteredType.GOOGLE}>Google</SelectItem>
                  <SelectItem value={UserRegisteredType.FACEBOOK}>Facebook</SelectItem>
                  <SelectItem value={UserRegisteredType.GITHUB}>Github</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-1 text-xs">Role Akun</Label>
              <Select
                value={data.role}
                onValueChange={(value) => setData('role', value as UserRole)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pilih Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={UserRole.USER}>User (Pelanggan)</SelectItem>
                  <SelectItem value={UserRole.ADMIN}>Admin (Pengelola)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-8 py-2 border-y border-slate-100">
            <div className="flex items-center gap-2">
              <Switch checked={data.is_banned} onCheckedChange={(v) => setData('is_banned', v)} />
              <Label className="text-xs cursor-pointer">Banned (Diblokir)</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={data.is_email_verified}
                onCheckedChange={(v) => setData('is_email_verified', v)}
              />
              <Label className="text-xs cursor-pointer">Email Terverifikasi</Label>
            </div>
          </div>

          {/* ========================================================= */}
          {/* TWO-FACTOR AUTHENTICATION (2FA) MANAGEMENT CARD */}
          {/* ========================================================= */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div
                  className={`p-2 rounded-xl ${
                    is2FaEnabled ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {is2FaEnabled ? (
                    <ShieldCheck className="w-5 h-5" />
                  ) : (
                    <ShieldAlert className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-slate-900">
                    Two-Factor Authentication (2FA)
                  </h4>
                  <p className="text-xs text-slate-500">
                    Proteksi login menggunakan Google Authenticator / Authy
                  </p>
                </div>
              </div>

              <div>
                {is2FaEnabled ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                    Aktif
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-200 text-slate-700">
                    Nonaktif
                  </span>
                )}
              </div>
            </div>

            {/* 2FA Action Buttons */}
            {is2FaEnabled ? (
              <div className="pt-2 flex items-center justify-between border-t border-slate-200/80 text-xs">
                <span className="text-slate-500">
                  User wajib memasukkan kode OTP 6-digit saat login.
                </span>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={handleDisable2Fa}
                  className="cursor-pointer gap-1.5 text-xs h-8"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reset / Nonaktifkan 2FA
                </Button>
              </div>
            ) : (
              <div className="pt-2 border-t border-slate-200/80">
                {!isSettingUp2Fa ? (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">
                      2FA belum diaktifkan untuk user ini.
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleGenerate2Fa}
                      disabled={is2FaLoading}
                      className="cursor-pointer gap-1.5 text-xs h-8 bg-white"
                    >
                      <KeyRound className="w-3.5 h-3.5 text-emerald-600" />
                      {is2FaLoading ? 'Membuat...' : 'Setup / Aktifkan 2FA'}
                    </Button>
                  </div>
                ) : (
                  /* 2FA Setup Flow */
                  <div className="space-y-3 bg-white p-3.5 rounded-xl border border-slate-200 text-xs">
                    <div className="font-semibold text-slate-800">Langkah Aktivasi 2FA:</div>
                    <ol className="list-decimal pl-4 space-y-1 text-slate-600">
                      <li>
                        Buka aplikasi <strong>Google Authenticator</strong> atau{' '}
                        <strong>Authy</strong>.
                      </li>
                      <li>
                        Pilih "Enter a setup key" dan masukkan <strong>Secret Key</strong> di bawah
                        ini.
                      </li>
                    </ol>

                    {generated2Fa && (
                      <div className="space-y-2">
                        <div>
                          <Label className="text-[11px] text-slate-500 block mb-1">
                            Base32 Secret Key:
                          </Label>
                          <div className="flex items-center justify-between bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 font-mono text-xs">
                            <span className="select-all font-bold tracking-wider">
                              {generated2Fa.secret}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopySecret(generated2Fa.secret)}
                              className="text-slate-500 hover:text-slate-800 p-1 rounded"
                            >
                              {isCopied ? (
                                <Check className="w-4 h-4 text-emerald-600" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </div>

                        <div>
                          <Label className="text-[11px] text-slate-500 block mb-1">
                            Kode Darurat (Recovery Codes):
                          </Label>
                          <div className="grid grid-cols-3 gap-1 bg-slate-50 p-2 rounded-lg border border-slate-200 font-mono text-[10px] text-slate-700">
                            {generated2Fa.recoveryCodes.map((code, idx) => (
                              <span
                                key={idx}
                                className="bg-white px-1.5 py-0.5 rounded text-center border border-slate-100"
                              >
                                {code}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="pt-2">
                          <Label className="text-[11px] text-slate-700 font-medium block mb-1">
                            Masukkan 6-Digit Kode OTP untuk Konfirmasi:
                          </Label>
                          <div className="flex gap-2">
                            <Input
                              type="text"
                              maxLength={6}
                              placeholder="Contoh: 123456"
                              value={verifyOtpCode}
                              onChange={(e) => setVerifyOtpCode(e.target.value)}
                              className="font-mono text-center tracking-widest text-sm h-9 max-w-[180px]"
                            />
                            <Button
                              type="button"
                              size="sm"
                              onClick={handleEnable2Fa}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-9 cursor-pointer"
                            >
                              Verifikasi & Aktifkan
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setIsSettingUp2Fa(false)
                                setGenerated2Fa(null)
                              }}
                              className="text-xs h-9"
                            >
                              Batal
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </form>

        <DialogFooter className="flex flex-row justify-end gap-3 pt-2">
          <DialogClose asChild>
            <Button variant="outline" type="button" className="text-xs">
              Tutup
            </Button>
          </DialogClose>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={processing}
            className="bg-slate-900 hover:bg-black text-white text-xs"
          >
            {processing ? 'Menyimpan...' : 'Simpan Perubahan'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
