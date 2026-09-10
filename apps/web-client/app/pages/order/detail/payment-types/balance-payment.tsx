import { WalletIcon } from 'lucide-react'
import { memo } from 'react'

interface Props {
  paymentName: string
}

export default memo(function BalancePayment({ paymentName }: Props) {
  return (
    <div className="space-y-3">
      <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-success/30 dark:border-success/40 rounded-lg">
        <div className="flex items-center justify-center gap-2 mb-2">
          <WalletIcon className="w-5 h-5 text-green-600 dark:text-green-400" />
          <p className="text-sm text-green-800 dark:text-green-300 font-medium">
            Pembayaran dengan Saldo
          </p>
        </div>
        <p className="text-sm text-green-800 dark:text-green-300 text-center">
          Pembayaran menggunakan saldo akun {paymentName}
        </p>
      </div>
      <div className="p-3 bg-green-50/50 dark:bg-green-900/10 rounded-lg border-l-4 border-success/40">
        <p className="text-xs text-green-700 dark:text-green-300">
          ✅ <strong>Otomatis:</strong> Saldo akan dipotong secara otomatis dari akun Anda
        </p>
      </div>
    </div>
  )
})
