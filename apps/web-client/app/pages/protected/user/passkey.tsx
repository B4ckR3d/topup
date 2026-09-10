import { useMutation, useQuery } from '@tanstack/react-query'
import { Button } from '@umbreon/ui/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@umbreon/ui/components/ui/dialog'
import { FingerprintIcon } from 'lucide-react'
import { useState } from 'react'
import toast from 'react-hot-toast'
import BreadcrumbBasic from '~/components/breadcrumb-basic'
import { registerPasskey } from '~/services/passkey'
import { queryClient } from '~/store/store'
import { apiClient } from '~/utils/axios'

export default function PasskeySetupPage() {
  const [passkeyToDelete, setPasskeyToDelete] = useState<string | null>(null)

  const passkeys = useQuery({
    queryKey: ['user-passkeys'],
    queryFn: () =>
      apiClient
        .get('/user/passkeys')
        .then((res) => res.data)
        .catch((err) => {
          throw new Error(`Error fetching passkeys: ${err.response?.data?.message}` || err.message)
        }),
  })

  const addPasskey = useMutation({
    mutationKey: ['add-passkey'],
    mutationFn: () => registerPasskey(),
    onSuccess: (res) => {
      toast.success(res.message || 'Passkey berhasil ditambahkan')
      passkeys.refetch()
      queryClient.invalidateQueries({ queryKey: ['userSecurityInfo'] })
    },
  })

  const deletePasskey = useMutation({
    mutationKey: ['delete-passkey'],
    mutationFn: (passkeyId: string) =>
      apiClient
        .delete(`/user/passkeys/${passkeyId}`)
        .then((res) => res.data)
        .catch((err) => {
          throw new Error(`Error deleting passkey: ${err.response?.data?.message}` || err.message)
        }),
  })

  return (
    <div className="space-y-6">
      <BreadcrumbBasic
        items={[
          {
            label: 'Home',
            href: '/',
          },
          {
            label: 'User',
            href: '/user',
          },
          {
            label: 'Settings',
            href: '/user/settings',
          },
          {
            label: 'Passkey',
          },
        ]}
      />

      <section>
        <div className="flex items-center justify-between gap-3 mb-2">
          <div>
            <h1 className="text-2xl font-bold">Kelola Passkey</h1>
            <p className="text-muted-foreground text-sm">
              Tambahkan atau hapus passkey untuk keamanan akun Anda.
            </p>
          </div>
          <Button type="button" onClick={() => addPasskey.mutate()} disabled={addPasskey.isPending}>
            {addPasskey.isPending ? 'Memproses...' : 'Tambah Passkey'}
          </Button>
        </div>

        <div className="mt-6 flex flex-col gap-4">
          {passkeys.isLoading && (
            <p className="text-sm text-muted-foreground animate-pulse">Memuat daftar passkey...</p>
          )}

          {!passkeys.isLoading && passkeys.data?.data?.length === 0 && (
            <div className="rounded-lg border border-dashed p-8 text-center bg-card text-card-foreground">
              <div className="mx-auto mb-3 w-fit rounded-full bg-primary/10 p-2 text-primary">
                <FingerprintIcon className="h-5 w-5" />
              </div>
              <p className="font-medium">Belum ada passkey</p>
              <p className="text-sm text-muted-foreground mt-1">
                Tambahkan passkey agar login lebih cepat dan aman.
              </p>
            </div>
          )}

          {passkeys.data?.data?.map((passkey: any) => (
            <div
              key={passkey.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg bg-card text-card-foreground shadow-sm gap-4 sm:gap-0"
            >
              <div className="flex items-start sm:items-center gap-4">
                <div className="p-3 rounded-full bg-primary/10 text-primary">
                  <FingerprintIcon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">
                    {passkey.credential_device_type || 'Perangkat Tidak Diketahui'}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Transport: {passkey.transports?.join(', ') || '-'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Terakhir digunakan:{' '}
                    {passkey.last_used_at
                      ? new Date(passkey.last_used_at).toLocaleString('id-ID', {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })
                      : '-'}
                  </p>
                </div>
              </div>

              <Button
                variant="ghost"
                size="sm"
                disabled={deletePasskey.isPending}
                className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                onClick={() => setPasskeyToDelete(passkey.id)}
              >
                Hapus
              </Button>
            </div>
          ))}
        </div>
      </section>

      <Dialog
        open={!!passkeyToDelete}
        onOpenChange={(isOpen) => {
          if (!isOpen && !deletePasskey.isPending) {
            setPasskeyToDelete(null)
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus Passkey?</DialogTitle>
            <DialogDescription>
              Passkey ini akan dihapus dari akun Anda. Anda mungkin tidak bisa login dengan
              perangkat ini lagi.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              disabled={deletePasskey.isPending}
              onClick={() => setPasskeyToDelete(null)}
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              disabled={deletePasskey.isPending}
              onClick={() => {
                if (passkeyToDelete) {
                  deletePasskey.mutate(passkeyToDelete, {
                    onSuccess: () => {
                      toast.success('Passkey berhasil dihapus')
                      passkeys.refetch()
                      queryClient.invalidateQueries({ queryKey: ['userSecurityInfo'] })
                      setPasskeyToDelete(null)
                    },
                  })
                }
              }}
            >
              {deletePasskey.isPending ? 'Menghapus...' : 'Hapus Passkey'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
