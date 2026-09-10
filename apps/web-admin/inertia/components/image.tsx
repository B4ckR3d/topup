import type React from 'react'

type ImageProps = React.ImgHTMLAttributes<HTMLImageElement> & {
  baseUrl?: string
}

function resolveSrc(src: string, baseUrl?: string) {
  if (!src) return ''
  if (src.includes(':9000/umbreon/')) {
    return src.split(':9000/umbreon')[1]
  }
  if (src.includes(':9000/')) {
    return src.split(':9000')[1]
  }
  if (src.startsWith('/storage/')) {
    return src
  }
  if (/^https?:\/\//i.test(src)) return src
  const base = baseUrl?.replace(/\/+$/g, '')
  if (base && !base.includes(':9000')) {
    if (src.startsWith('/')) return `${base}${src}`
    return `${base}/${src}`
  }
  return src.startsWith('/') ? src : `/${src}`
}

const _baseUrl = import.meta.env.VITE_S3_URL

export default function Image({ src, baseUrl = _baseUrl, ...rest }: ImageProps) {
  const finalSrc =
    typeof src === 'string' && src.trim().length > 0 ? resolveSrc(src, baseUrl) : undefined
  return <img src={finalSrc} {...rest} alt={rest.alt ?? ''} />
}
