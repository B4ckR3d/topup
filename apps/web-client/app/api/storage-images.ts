import type { LoaderFunctionArgs } from 'react-router'

export async function loader({ params }: LoaderFunctionArgs) {
  const fileName = params.fileName
  if (!fileName || fileName.includes('..') || fileName.includes('/')) {
    return new Response('Invalid file name', { status: 400 })
  }

  const internalApi = process.env.INTERNAL_API_URL || 'http://web-api:9991'
  try {
    const res = await fetch(`${internalApi}/storage/images/${encodeURIComponent(fileName)}`)
    if (!res.ok) {
      return new Response('Image not found', { status: res.status })
    }

    const ext = fileName.split('.').pop()?.toLowerCase()
    const mimeTypes: Record<string, string> = {
      webp: 'image/webp',
      png: 'image/png',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      svg: 'image/svg+xml',
      gif: 'image/gif',
      avif: 'image/avif',
    }
    const contentType = (ext && mimeTypes[ext]) || res.headers.get('content-type') || 'image/webp'

    const buffer = await res.arrayBuffer()
    return new Response(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch (err: any) {
    console.error('[Storage Image Proxy Error]:', err?.message || err)
    return new Response('Failed to load image', { status: 502 })
  }
}
