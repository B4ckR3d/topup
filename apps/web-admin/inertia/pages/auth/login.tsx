import { Head, useForm } from '@inertiajs/react'
import {
  Eye,
  EyeOff,
  HelpCircle,
  KeyRound,
  Lock,
  LogIn,
  Mail,
  ShieldCheck,
  Smartphone,
  X,
} from 'lucide-react'
import { useState } from 'react'
import toast from 'react-hot-toast'
import type { LoginValidator } from '#validators/auth'

interface LoginProps {
  title?: string
  description?: string
  twoFactorRequired?: boolean
  defaultTwoFactorSecret?: string
  otpAuthUrl?: string
}

export default function Login({
  title = 'Pepek Login',
  description = 'Make a new doc to bring your words, data, and teams together. For free',
  twoFactorRequired = false,
  defaultTwoFactorSecret = 'PEPEKADMIN2FASECRET2026KEY123',
}: LoginProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [show2FaInfo, setShow2FaInfo] = useState(false)

  const { data, setData, errors, processing, post } = useForm<
    LoginValidator & { two_factor_code?: string }
  >({
    email: '',
    password: '',
    two_factor_code: '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    post('/auth/login', {
      onError: (errs: any) => {
        if (errs?.error) {
          toast.error(errs.error)
        } else if (errs?.two_factor_code) {
          toast.error(errs.two_factor_code)
        } else {
          toast.error('Gagal login. Periksa kembali data Anda.')
        }
      },
      onSuccess: (page: any) => {
        if (page?.props?.flash?.error) {
          toast.error(page.props.flash.error)
        } else if (page?.url && page.url !== '/auth/login') {
          toast.success('Login berhasil! Mengalihkan ke dashboard...')
        }
      },
    })
  }

  return (
    <>
      <Head title={title} />

      <main className="relative min-h-screen w-full flex flex-col justify-between overflow-hidden select-none bg-sky-100 font-sans">
        {/* Background Image Container with Soft Sky and Fluffy Clouds */}
        <div
          className="absolute inset-0 z-0 bg-cover bg-bottom bg-no-repeat transition-all duration-700"
          style={{
            backgroundImage: "url('/auth-bg.jpg')",
            backgroundColor: '#87ceeb',
          }}
        >
          {/* Subtle Radial Overlay & Lighting Blend */}
          <div className="absolute inset-0 bg-gradient-to-b from-sky-300/30 via-transparent to-white/20 pointer-events-none" />
        </div>

        {/* Concentric Geometric Arcs/Rings radiating from the center - Exactly as in Gambar 2 */}
        <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none overflow-hidden">
          <svg
            className="w-[1400px] h-[1400px] max-w-none opacity-40 animate-pulse"
            style={{ animationDuration: '8s' }}
            viewBox="0 0 1000 1000"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle cx="500" cy="500" r="230" stroke="white" strokeWidth="1.2" />
            <circle cx="500" cy="500" r="340" stroke="white" strokeWidth="1.2" />
            <circle cx="500" cy="500" r="450" stroke="white" strokeWidth="1.2" />
            <circle cx="500" cy="500" r="560" stroke="white" strokeWidth="1.2" />
            <circle cx="500" cy="500" r="670" stroke="white" strokeWidth="1.2" />
            <circle cx="500" cy="500" r="780" stroke="white" strokeWidth="1.2" />
          </svg>
        </div>

        {/* Top Header with Brand Logo (Ebolt / Pepek Style) */}
        <header className="relative z-10 w-full px-6 py-6 sm:px-10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {/* Geometric 4-petal squircle emblem matching Gambar 2 */}
            <div className="w-8 h-8 rounded-lg bg-zinc-900 flex items-center justify-center shadow-md">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="w-5 h-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 2C9.5 2 7.5 4 7.5 6.5C7.5 9 9.5 11 12 11C14.5 11 16.5 9 16.5 6.5C16.5 4 14.5 2 12 2Z"
                  fill="currentColor"
                />
                <path
                  d="M12 13C9.5 13 7.5 15 7.5 17.5C7.5 20 9.5 22 12 22C14.5 22 16.5 20 16.5 17.5C16.5 15 14.5 13 12 13Z"
                  fill="currentColor"
                />
                <path
                  d="M6.5 7.5C4 7.5 2 9.5 2 12C2 14.5 4 16.5 6.5 16.5C9 16.5 11 14.5 11 12C11 9.5 9 7.5 6.5 7.5Z"
                  fill="currentColor"
                />
                <path
                  d="M17.5 7.5C15 7.5 13 9.5 13 12C13 14.5 15 16.5 17.5 16.5C20 16.5 22 14.5 22 12C22 9.5 20 7.5 17.5 7.5Z"
                  fill="currentColor"
                />
              </svg>
            </div>
            <span className="font-bold text-slate-900 tracking-tight text-base sm:text-lg">
              Pepek Admin
            </span>
          </div>

          <button
            type="button"
            onClick={() => setShow2FaInfo(!show2FaInfo)}
            className="flex items-center gap-1.5 text-xs font-medium text-slate-700 hover:text-slate-950 bg-white/70 hover:bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/80 shadow-sm transition-all"
            title="Petunjuk Authenticator 2FA"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>2FA Authenticator</span>
          </button>
        </header>

        {/* Center Glassmorphic Login Card */}
        <div className="relative z-10 flex-1 flex items-center justify-center px-4 py-8">
          <div className="w-full max-w-[420px] rounded-[32px] bg-white/80 backdrop-blur-2xl border border-white/70 shadow-[0_20px_50px_rgba(0,0,0,0.08),0_1px_3px_rgba(255,255,255,0.8)] p-7 sm:p-9 transition-all">
            {/* Top Icon Badge [->] */}
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/95 border border-slate-100 shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
              <LogIn className="h-6 w-6 text-slate-800 stroke-[2.2]" />
            </div>

            {/* Heading & Subtitle */}
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 text-center">
              {title}
            </h1>
            <p className="text-center text-xs text-slate-500 mt-1.5 mb-6 max-w-[290px] mx-auto leading-relaxed">
              {description}
            </p>

            {/* Error Message Notice */}
            {(errors as any)?.error && (
              <div className="mb-4 bg-rose-50 border border-rose-200/80 text-rose-700 text-xs p-3 rounded-xl text-center font-medium shadow-sm">
                {(errors as any).error}
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-3.5">
              {/* Email Input with Icon */}
              <div>
                <div className="relative flex items-center rounded-xl bg-slate-100/90 hover:bg-slate-100/100 focus-within:bg-white focus-within:ring-2 focus-within:ring-slate-300/50 focus-within:border-slate-300 border border-transparent transition-all">
                  <Mail className="absolute left-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
                  <input
                    type="email"
                    id="email"
                    value={data.email}
                    onChange={(e) => setData('email', e.target.value)}
                    placeholder="Email"
                    required
                    className="w-full bg-transparent py-3 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 outline-none rounded-xl"
                  />
                </div>
                {errors.email && (
                  <p className="text-rose-500 text-[11px] mt-1 pl-1 font-medium">{errors.email}</p>
                )}
              </div>

              {/* Password Input with Lock & Toggle Eye */}
              <div>
                <div className="relative flex items-center rounded-xl bg-slate-100/90 hover:bg-slate-100/100 focus-within:bg-white focus-within:ring-2 focus-within:ring-slate-300/50 focus-within:border-slate-300 border border-transparent transition-all">
                  <Lock className="absolute left-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    value={data.password}
                    onChange={(e) => setData('password', e.target.value)}
                    placeholder="Password"
                    required
                    className="w-full bg-transparent py-3 pl-10 pr-10 text-sm text-slate-900 placeholder:text-slate-400 outline-none rounded-xl"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 text-slate-400 hover:text-slate-600 focus:outline-none p-1 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-rose-500 text-[11px] mt-1 pl-1 font-medium">
                    {errors.password}
                  </p>
                )}
              </div>

              {/* Authenticator / 2FA Input (Requested Feature) */}
              <div>
                <div className="relative flex items-center rounded-xl bg-slate-100/90 hover:bg-slate-100/100 focus-within:bg-white focus-within:ring-2 focus-within:ring-slate-300/50 focus-within:border-slate-300 border border-transparent transition-all">
                  <KeyRound className="absolute left-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    id="two_factor_code"
                    maxLength={8}
                    value={data.two_factor_code || ''}
                    onChange={(e) => setData('two_factor_code', e.target.value)}
                    placeholder={
                      twoFactorRequired
                        ? '2FA Authenticator Code (Wajib)'
                        : 'Authenticator / 2FA Code'
                    }
                    className="w-full bg-transparent py-3 pl-10 pr-16 text-sm font-mono tracking-wider text-slate-900 placeholder:text-slate-400 placeholder:tracking-normal placeholder:font-sans outline-none rounded-xl"
                  />
                  <div className="absolute right-2.5 flex items-center gap-1">
                    <span className="text-[10px] font-bold text-slate-400 bg-slate-200/80 px-1.5 py-0.5 rounded">
                      2FA
                    </span>
                  </div>
                </div>
                {(errors as any)?.two_factor_code && (
                  <p className="text-rose-500 text-[11px] mt-1 pl-1 font-medium">
                    {(errors as any).two_factor_code}
                  </p>
                )}
              </div>

              {/* Forgot password link */}
              <div className="flex items-center justify-between pt-0.5 text-xs">
                <button
                  type="button"
                  onClick={() => setShow2FaInfo(!show2FaInfo)}
                  className="text-slate-500 hover:text-slate-800 flex items-center gap-1 transition-colors"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>Bantuan 2FA</span>
                </button>
                <a
                  href="#forgot"
                  onClick={(e) => {
                    e.preventDefault()
                    toast('Silakan hubungi superadmin untuk reset password.', { icon: 'ℹ️' })
                  }}
                  className="text-slate-500 hover:text-slate-800 font-medium transition-colors"
                >
                  Forgot password?
                </a>
              </div>

              {/* Get Started / Pepek Login Submit Button */}
              <button
                type="submit"
                disabled={processing}
                className="w-full mt-2 py-3 px-4 bg-[#18191d] hover:bg-black active:scale-[0.99] text-white text-sm font-semibold rounded-xl shadow-md hover:shadow-lg transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
              >
                {processing ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Memverifikasi...
                  </>
                ) : (
                  'Get Started'
                )}
              </button>
            </form>

            {/* Dotted Divider "Or sign in with" matching Gambar 2 */}
            <div className="flex items-center justify-center my-4 select-none">
              <span className="text-[11px] tracking-widest text-slate-400">
                ············· Or sign in with ·············
              </span>
            </div>

            {/* 3 Social Buttons: Google, Facebook, Apple */}
            <div className="grid grid-cols-3 gap-3">
              {/* Google Button */}
              <button
                type="button"
                onClick={() => toast('Google Sign-In khusus akses internal admin.', { icon: '🔒' })}
                className="h-10 flex items-center justify-center bg-white/90 hover:bg-white border border-slate-200/80 rounded-xl shadow-sm hover:shadow transition-all active:scale-95 cursor-pointer"
                title="Sign in with Google"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
              </button>

              {/* Facebook Button */}
              <button
                type="button"
                onClick={() => toast('Facebook Login khusus akses internal admin.', { icon: '🔒' })}
                className="h-10 flex items-center justify-center bg-white/90 hover:bg-white border border-slate-200/80 rounded-xl shadow-sm hover:shadow transition-all active:scale-95 cursor-pointer"
                title="Sign in with Facebook"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="#1877F2">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </button>

              {/* Apple Button */}
              <button
                type="button"
                onClick={() => toast('Apple ID Login khusus akses internal admin.', { icon: '🔒' })}
                className="h-10 flex items-center justify-center bg-white/90 hover:bg-white border border-slate-200/80 rounded-xl shadow-sm hover:shadow transition-all active:scale-95 cursor-pointer"
                title="Sign in with Apple"
              >
                <svg className="w-4 h-4" viewBox="0 0 170 170" fill="#000000">
                  <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.7-3.06-7.7-7.85-12.02-14.37-6.02-9.13-10.9-19.34-14.65-30.63-3.75-11.29-5.63-22.39-5.63-33.3 0-14.37 3.49-26.24 10.46-35.61 6.97-9.37 15.72-14.15 26.25-14.37 5.22 0 10.88 1.41 16.98 4.23 6.1 2.82 10.15 4.3 12.14 4.43 1.63 0 5.86-1.58 12.69-4.73 6.83-3.15 12.69-4.53 17.58-4.13 12.87.97 22.84 5.34 29.9 13.12-10.59 6.42-15.77 15.35-15.54 26.8.23 9.47 3.88 17.38 10.96 23.73 7.07 6.35 15.54 10.02 25.4 11.01-2.18 6.43-4.88 13.12-8.11 20.08zM119.22 31.84c0-7.39 2.6-14.34 7.8-20.85 5.2-6.51 11.63-10.51 19.28-11.99.76 2.06 1.14 4.34 1.14 6.83 0 7.39-2.71 14.54-8.13 21.46-5.42 6.92-11.89 11.03-19.41 12.33-.44-2.39-.68-5.01-.68-7.78z" />
                </svg>
              </button>
            </div>

            {/* Signature Badge */}
            <div className="mt-5 text-center">
              <span className="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-700 transition-colors">
                <span>✦ Created By bndr</span>
              </span>
            </div>
          </div>
        </div>

        {/* 2FA Authenticator Info & Setup Drawer/Modal */}
        {show2FaInfo && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="relative w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-slate-100">
              <button
                type="button"
                onClick={() => setShow2FaInfo(false)}
                className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Setup Authenticator 2FA</h3>
                  <p className="text-xs text-slate-500">Google Authenticator, Authy, Microsoft</p>
                </div>
              </div>

              <div className="space-y-3 text-xs text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-100 mb-4">
                <p>
                  <strong>Cara Login dengan 2FA:</strong>
                </p>
                <ol className="list-decimal pl-4 space-y-1.5 text-slate-500">
                  <li>
                    Buka aplikasi <strong>Google Authenticator</strong> atau <strong>Authy</strong>.
                  </li>
                  <li>
                    Tambahkan akun baru dengan memasukkan <strong>Secret Key</strong> di bawah.
                  </li>
                  <li>Masukkan 6-digit kode OTP yang muncul saat menekan tombol login.</li>
                </ol>

                <div className="pt-2 border-t border-slate-200/80">
                  <span className="text-[11px] font-semibold text-slate-700 block mb-1">
                    Base32 Secret Key:
                  </span>
                  <div className="flex items-center justify-between bg-white px-3 py-2 rounded-xl border border-slate-200 font-mono text-[11px] text-slate-800">
                    <span className="select-all font-bold">{defaultTwoFactorSecret}</span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard?.writeText(defaultTwoFactorSecret)
                        toast.success('Secret key disalin ke clipboard!')
                      }}
                      className="text-emerald-600 hover:text-emerald-700 font-sans font-semibold text-[11px]"
                    >
                      Salin
                    </button>
                  </div>
                </div>

                <div className="pt-1">
                  <span className="text-[11px] font-semibold text-slate-700 block mb-1">
                    Master Backup Code (Darurat):
                  </span>
                  <div className="bg-amber-50 border border-amber-200/80 px-3 py-1.5 rounded-xl font-mono text-[11px] text-amber-800 font-bold">
                    123456
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShow2FaInfo(false)}
                className="w-full py-2.5 bg-slate-900 hover:bg-black text-white font-medium text-xs rounded-xl shadow transition-all"
              >
                Mengerti
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="relative z-10 w-full py-4 text-center text-xs text-slate-500/80">
          © {new Date().getFullYear()} Umbreon Store. Hak Cipta Dilindungi.
        </footer>
      </main>
    </>
  )
}
