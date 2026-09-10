import { Link } from '@inertiajs/react'
import { ArrowLeft, ShieldAlert } from 'lucide-react'

export default function Register() {
  return (
    <main className="relative min-h-screen w-full flex flex-col justify-between overflow-hidden select-none bg-sky-100 font-sans">
      {/* Background Image Container */}
      <div
        className="absolute inset-0 z-0 bg-cover bg-bottom bg-no-repeat"
        style={{
          backgroundImage: "url('/auth-bg.jpg')",
          backgroundColor: '#87ceeb',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-sky-300/30 via-transparent to-white/20 pointer-events-none" />
      </div>

      {/* Header */}
      <header className="relative z-10 w-full px-6 py-6 sm:px-10 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-zinc-900 flex items-center justify-center shadow-md">
            <span className="text-white font-bold text-sm">P</span>
          </div>
          <span className="font-bold text-slate-900 tracking-tight text-base sm:text-lg">
            Pepek Admin
          </span>
        </div>
      </header>

      {/* Disabled Registration Card */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-[420px] rounded-[32px] bg-white/85 backdrop-blur-2xl border border-white/70 shadow-[0_20px_50px_rgba(0,0,0,0.08)] p-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 border border-amber-200 shadow-sm text-amber-600">
            <ShieldAlert className="h-7 w-7" />
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-slate-900 mb-2">
            Registrasi Dinonaktifkan
          </h1>
          <p className="text-xs text-slate-500 mb-6 leading-relaxed">
            Pendaftaran admin publik telah dinonaktifkan demi alasan keamanan. Akun baru hanya dapat
            dibuat oleh Superadmin melalui dashboard internal.
          </p>

          <Link
            href="/auth/login"
            className="w-full py-3 px-4 bg-slate-900 hover:bg-black text-white text-sm font-semibold rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Pepek Login</span>
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 w-full py-4 text-center text-xs text-slate-500/80">
        © {new Date().getFullYear()} Umbreon Store. Hak Cipta Dilindungi.
      </footer>
    </main>
  )
}
