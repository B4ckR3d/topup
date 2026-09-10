import { useForm } from '@inertiajs/react'
import { RefundStatus } from '@umbreon/db/types'
import { Button } from '@umbreon/ui/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@umbreon/ui/components/ui/dialog'
import { Label } from '@umbreon/ui/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@umbreon/ui/components/ui/select'
import { PencilIcon } from 'lucide-react'
import { useState } from 'react'
import toast from 'react-hot-toast'
import type { UpdateOrderRefundStatusValidator } from '#validators/order'

export default function ChangeRefundStatusModal({
  orderId,
  status,
}: {
  orderId: string
  status: RefundStatus
}) {
  const [open, setOpen] = useState(false)

  const form = useForm<UpdateOrderRefundStatusValidator>({
    status: status,
  })
  const { data, setData } = form

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    form.patch(`/admin/orders/${orderId}/change-refund-status`, {
      onSuccess: () => {
        setOpen(false)
      },
      onError: (error) => {
        toast.error(`Error changing status: ${error.error}`)
        console.error('Error changing status:', error)
      },
    })
  }

  const handleOpenChange = (value: boolean) => {
    setOpen(value)
    if (value) {
      setData('status', status)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <button className="hover:opacity-70 cursor-pointer">
          <PencilIcon className="w-3.5 h-3.5" />
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-start">Change Deposit Status</DialogTitle>
        </DialogHeader>
        <form className="space-y-4">
          <div>
            <Label htmlFor="status" className="block mb-2">
              Status
            </Label>
            <Select
              onValueChange={(value) => setData('status', value as RefundStatus)}
              value={data.status}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {Object.values(RefundStatus).map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.errors.status && (
              <p className="text-red-500 text-sm mt-1">{form.errors.status}</p>
            )}
            <small className="text-xs text-red-500 italic">
              * Mengubah status refund secara manual tidak otomatis melakukan refund balance.
              <br />* Mengubah disini tidak akan melakukan ekseskui ototomatis pada sistem refund
              (Hanya mengubah statusnya saja).
              <br />* Untuk refund dilahkan pake tombol refund (Akan muncul jika payment status
              SUUCCESS dan Order status FAILED).
              <br />
              !! Gunakan dengan Bijak
            </small>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)} type="button">
              Cancel
            </Button>
            <Button type="submit" size="sm" onClick={handleSubmit} disabled={form.processing}>
              Save
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
