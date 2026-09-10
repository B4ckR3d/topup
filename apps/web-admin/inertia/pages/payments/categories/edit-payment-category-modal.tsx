import { router, useForm } from '@inertiajs/react'
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
import { type FormEvent, useState } from 'react'

export function EditPaymentCategoryModal({ id, name }: { id: number | string; name: string }) {
  const [open, setOpen] = useState(false)
  const form = useForm<{ name: string }>({
    name: name || '',
  })
  const { data, setData } = form

  const handleOpenChange = (value: boolean) => {
    setOpen(value)
    if (value) {
      setData('name', name)
    }
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    form.patch(`/admin/payments/categories/${id}`, {
      onSuccess: () => {
        setOpen(false)
        router.flushAll()
      },
    })
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Edit
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Payment Category</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="edit-name" className="mb-2">
              Name
            </Label>
            <Input
              id="edit-name"
              placeholder="Name"
              value={data.name}
              onChange={(e) => setData('name', e.target.value)}
              required
            />
            {form.errors.name && (
              <div className="text-red-500 text-xs mt-1">{form.errors.name}</div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} type="button">
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={form.processing}>
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
