import { useInfiniteQuery, useMutation } from '@tanstack/react-query'
import type { InferSelectModel } from '@umbreon/db'
import type { tb } from '@umbreon/db/types'
import { Button } from '@umbreon/ui/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@umbreon/ui/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@umbreon/ui/components/ui/tabs'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import toast from 'react-hot-toast'
import { apiClient } from '~/utils/axios'

type FileListResponse = {
  data: InferSelectModel<typeof tb.fileManager>[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

function FileUploadDropzone({ onFilesSelected }: { onFilesSelected?: (files: File[]) => void }) {
  const [files, setFiles] = useState<File[]>([])

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      setFiles(acceptedFiles)
      if (onFilesSelected) {
        onFilesSelected(acceptedFiles)
      }
    },
    [onFilesSelected],
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: true,
  })

  return (
    <div
      {...getRootProps()}
      className={`border border-dashed rounded-md p-6 text-center transition-colors cursor-pointer ${
        isDragActive ? 'border-primary/40 bg-primary/10' : 'border-border/70'
      }`}
    >
      <input {...getInputProps()} />
      <p className="text-muted-foreground">
        {isDragActive
          ? 'Drop the files here ...'
          : files.length === 0
            ? 'Drag & drop files here, or click to select files'
            : `${files.length} file(s) selected`}
      </p>
      {files.length > 0 && (
        <ul className="mt-2 text-sm text-foreground">
          {files.map((file) => (
            <li key={file.name}>{file.name}</li>
          ))}
        </ul>
      )}
    </div>
  )
}

function resolveFileUrl(url?: string | null): string {
  if (!url) return ''
  if (url.includes(':9000/umbreon/')) {
    return url.split(':9000/umbreon')[1]
  }
  if (url.includes(':9000/')) {
    return url.split(':9000')[1]
  }
  if (url.startsWith('/storage/')) {
    return url
  }
  if (/^https?:\/\//i.test(url)) {
    return url
  }
  const s3Url = (import.meta.env.VITE_S3_URL || '').trim()
  if (s3Url && !s3Url.includes(':9000')) {
    return `${s3Url.replace(/\/+$/, '')}/${url.replace(/^\/+/, '')}`
  }
  return url.startsWith('/') ? url : `/${url}`
}

export default function FileManager({
  onFilesSelected,
  defaultFileId,
}: {
  onFilesSelected?: (file: InferSelectModel<typeof tb.fileManager>) => void
  defaultFileId?: string
}) {
  const [files, setFiles] = useState<File[] | null>(null)
  const [activeTab, setActiveTab] = useState<'list-file' | 'upload-file'>('list-file')
  const [selectedFileIds, setSelectedFileIds] = useState<string[]>([])
  const [selectedFile, setSelectedFile] = useState<InferSelectModel<typeof tb.fileManager> | null>(
    null,
  )
  const [open, setOpen] = useState(false)
  const loaderRef = useRef<HTMLDivElement | null>(null)
  const fetchedDefaultIdRef = useRef<string | null>(null)

  const listFile = useInfiniteQuery<FileListResponse>({
    queryKey: ['listFile'],
    queryFn: async ({ pageParam = 1 }) =>
      await apiClient
        .get('/admin/file-managers', {
          params: { page: pageParam },
        })
        .then((res) => res.data)
        .catch((error) => {
          toast.error(error.response?.data?.error || 'Failed to fetch files')
          console.error('Failed to fetch files:', error)
          throw new Error('Failed to fetch files')
        }),
    getNextPageParam: (lastPage) => {
      const currentPage = lastPage.pagination?.page ?? 1
      const totalPages = lastPage.pagination?.totalPages ?? 1
      return currentPage < totalPages ? currentPage + 1 : undefined
    },
    initialPageParam: 1,
    enabled: false,
  })

  const filesData = listFile.data?.pages.flatMap((page) => page.data) ?? []
  const { refetch, fetchNextPage, hasNextPage, isFetchingNextPage, isFetching } = listFile

  const uploadFiles = useMutation({
    mutationKey: ['uploadFiles'],
    mutationFn: async (uploadItems: File[] | null) => {
      if (!uploadItems || uploadItems.length === 0) {
        throw new Error('No files selected for upload')
      }

      const formData = new FormData()
      uploadItems.forEach((file) => {
        formData.append('files', file)
      })

      return apiClient
        .post('/admin/file-managers/upload-many', formData)
        .then((response) => {
          const uploadedCount = response.data?.files?.length ?? 0
          const errorCount = response.data?.errors?.length ?? 0
          if (uploadedCount > 0) {
            toast.success(`Uploaded ${uploadedCount} file(s)`)
          }
          if (errorCount > 0) {
            const firstErr = response.data?.errors?.[0]?.error
            toast.error(firstErr ? `Failed: ${firstErr}` : `Failed ${errorCount} file(s)`)
          }
          if (uploadedCount === 0 && errorCount === 0) {
            toast.success('Files uploaded')
          }
          refetch()
          setFiles(null)
          setActiveTab('list-file')
          return response.data
        })
        .catch((error) => {
          const errMsg =
            error.response?.data?.error ||
            error.response?.data?.details ||
            error.response?.data?.message ||
            error.message ||
            'File upload failed'
          toast.error(errMsg)
          console.error('File upload failed:', error)
          throw new Error(errMsg)
        })
    },
  })

  const deleteFile = useMutation({
    mutationKey: ['deleteFile'],
    mutationFn: async (fileId: string) => {
      return apiClient
        .delete(`/admin/file-managers/${fileId}`)
        .then((response) => {
          toast.success('File deleted successfully')
          refetch()
          setSelectedFile(null)
          return response.data
        })
        .catch((error) => {
          toast.error(error.response?.data?.error || 'File deletion failed')
          console.error('File deletion failed:', error)
          throw new Error('File deletion failed')
        })
    },
  })

  const deleteFiles = useMutation({
    mutationKey: ['deleteFiles'],
    mutationFn: async (ids: string[]) => {
      return apiClient
        .post('/admin/file-managers/delete-bulk', { ids })
        .then((response) => {
          const deletedCount = response.data?.deleted?.length ?? 0
          const errorCount = response.data?.errors?.length ?? 0
          if (deletedCount > 0) {
            toast.success(`Deleted ${deletedCount} file(s)`)
          }
          if (errorCount > 0) {
            toast.error(`Failed ${errorCount} file(s)`)
          }
          refetch()
          setSelectedFileIds([])
          if (selectedFile && ids.includes(selectedFile.id)) {
            setSelectedFile(null)
          }
          return response.data
        })
        .catch((error) => {
          toast.error(error.response?.data?.error || 'File deletion failed')
          console.error('File deletion failed:', error)
          throw new Error('File deletion failed')
        })
    },
  })

  const getDefaultFile = useMutation({
    mutationKey: ['getDefaultFile', defaultFileId],
    mutationFn: async () => {
      return await apiClient
        .get(`/admin/file-managers/${defaultFileId}`)
        .then((res) => {
          // Cek apakah file ada di res.data.data atau res.data
          const file = res.data?.data || res.data
          if (!file || !file.url) {
            console.warn('Default file response missing url or file:', file)
          }
          setSelectedFile(file)
          return file
        })
        .catch((error) => {
          toast.error(error.response?.data?.error || 'Failed to fetch default file')
          console.error('Failed to fetch default file:', error)
          throw new Error('Failed to fetch default file')
        })
    },
  })

  const handleFileSelect = (file: InferSelectModel<typeof tb.fileManager>) => {
    if (onFilesSelected) {
      setOpen(false)
      onFilesSelected(file)
    }
  }

  const toggleSelectedFileId = (id: string) => {
    setSelectedFileIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    )
  }

  // Fetch file list every time dialog open
  useEffect(() => {
    if (open) {
      refetch()
    }
  }, [open, refetch])

  useEffect(() => {
    if (!open) {
      return
    }

    const target = loaderRef.current
    if (!target) {
      return
    }

    const observer = new IntersectionObserver((entries) => {
      const [entry] = entries
      if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage()
      }
    })

    observer.observe(target)

    return () => {
      observer.disconnect()
    }
  }, [open, fetchNextPage, hasNextPage, isFetchingNextPage])

  // Fetch default file only once per defaultFileId
  useEffect(() => {
    if (!defaultFileId) {
      fetchedDefaultIdRef.current = null
      return
    }

    if (selectedFile?.id === defaultFileId) {
      return
    }

    if (fetchedDefaultIdRef.current === defaultFileId) {
      return
    }

    fetchedDefaultIdRef.current = defaultFileId
    getDefaultFile.mutate(undefined, {
      onError: () => {
        fetchedDefaultIdRef.current = null
      },
    })
  }, [defaultFileId, selectedFile?.id, getDefaultFile])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {selectedFile?.url ? (
          <div className="rounded-md border border-border/70 flex items-center justify-center overflow-hidden">
            <img
              src={resolveFileUrl(selectedFile.url)}
              alt={selectedFile.name || ''}
              className="object-contain max-h-28 max-w-full"
            />
          </div>
        ) : (
          <div className="rounded-md border border-dashed border-border/70 flex flex-col items-center justify-center gap-1 p-2 text-muted-foreground">
            <span className="text-xs">Select or upload your file</span>
            <span className="text-xs text-muted-foreground/80">
              Accept: <span className="font-mono">jpg, png, avif, webp</span>
            </span>
            <span className="text-xs text-muted-foreground/80">Max size: 5MB</span>
          </div>
        )}
      </DialogTrigger>
      <DialogContent className="w-full max-w-[90vw] md:max-w-4xl h-[90vh] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-start">File Manager</DialogTitle>
          <DialogDescription></DialogDescription>
        </DialogHeader>

        <Tabs
          value={activeTab}
          onValueChange={(val) => setActiveTab(val as 'list-file' | 'upload-file')}
          className="flex flex-1 flex-col gap-4 overflow-hidden"
        >
          <TabsList className="flex flex-wrap justify-start gap-2 shrink-0">
            <TabsTrigger value="list-file">Files</TabsTrigger>
            <TabsTrigger value="upload-file">Upload</TabsTrigger>
          </TabsList>
          <TabsContent value="list-file" className="flex-1 overflow-hidden flex">
            <div className="flex-1 overflow-y-auto pr-2">
              <div className="mt-2 space-y-4 pb-24">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {filesData.map((file: InferSelectModel<typeof tb.fileManager>) => (
                    <label key={file.id} className="relative block cursor-pointer group">
                      <input
                        type="checkbox"
                        className="absolute right-2 top-2 z-10"
                        checked={selectedFileIds.includes(file.id)}
                        onChange={() => toggleSelectedFileId(file.id)}
                      />
                      <img
                        src={resolveFileUrl(file.url)}
                        alt={file.name || ''}
                        onClick={() => setSelectedFile(file)}
                        className={`shadow rounded-md border transition-colors w-full object-contain ${selectedFile?.id === file.id ? 'border-primary/40 ring-1 ring-primary/15' : 'border-transparent'}`}
                      />
                    </label>
                  ))}
                </div>
                {filesData.length === 0 && !isFetching && (
                  <p className="text-sm text-muted-foreground text-center">No files found.</p>
                )}
                {isFetchingNextPage && (
                  <p className="text-xs text-muted-foreground text-center">Loading more...</p>
                )}
                <div ref={loaderRef} className="h-4" />
              </div>
              {(selectedFile || selectedFileIds.length > 0) && (
                <div className="sticky z-10 bottom-0 left-0 right-0 bg-background pt-4 pb-4 flex flex-wrap justify-end gap-2 border-t border-border/70">
                  {selectedFileIds.length > 0 ? (
                    <Button
                      size="sm"
                      variant="destructive"
                      disabled={deleteFiles.isPending}
                      onClick={() => deleteFiles.mutate(selectedFileIds)}
                    >
                      {deleteFiles.isPending
                        ? 'Deleting...'
                        : `Delete Selected (${selectedFileIds.length})`}
                    </Button>
                  ) : (
                    selectedFile && (
                      <Button
                        size="sm"
                        variant="destructive"
                        disabled={!selectedFile.id || deleteFile.isPending}
                        onClick={() => deleteFile.mutate(selectedFile.id)}
                      >
                        {deleteFile.isPending ? 'Deleting...' : 'Delete File'}
                      </Button>
                    )
                  )}
                  <Button
                    size="sm"
                    disabled={!selectedFile || deleteFiles.isPending || deleteFile.isPending}
                    onClick={() => {
                      if (selectedFile) {
                        handleFileSelect(selectedFile)
                      }
                    }}
                  >
                    {selectedFile ? 'Select File' : 'No File Selected'}
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>
          <TabsContent value="upload-file" className="flex-1 overflow-y-auto">
            <FileUploadDropzone onFilesSelected={(file) => setFiles(file)} />
            <DialogFooter className="mt-4 flex flex-wrap justify-end gap-2">
              <Button
                size="sm"
                onClick={() => uploadFiles.mutate(files)}
                disabled={uploadFiles.isPending || !files || files.length === 0}
              >
                {uploadFiles.isPending ? 'Uploading...' : 'Upload Files'}
              </Button>
            </DialogFooter>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
