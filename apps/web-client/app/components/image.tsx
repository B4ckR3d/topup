import React from 'react'

type ImageProps = React.ImgHTMLAttributes<HTMLImageElement> & {
  baseUrl?: string
}

function resolveSrc(src: string, baseUrl?: string) {
  if (!src) return ''
  if (src.includes(':9000/umbreon/')) {
    src = src.split(':9000/umbreon')[1]
  } else if (src.includes(':9000/')) {
    src = src.split(':9000')[1]
  }
  if (/^https?:\/\//i.test(src)) return src

  const apiBase = import.meta.env.VITE_API_URL || ''
  const base =
    baseUrl && !baseUrl.includes(':9000')
      ? baseUrl.replace(/\/+$/g, '')
      : apiBase.replace(/\/+$/g, '')
  if (src.startsWith('/')) return `${base}${src}`
  return `${base}/${src}`
}

const _baseUrl = import.meta.env.VITE_S3_URL

export default function Image({ src, baseUrl = _baseUrl, alt = '', ...rest }: ImageProps) {
  const finalSrc =
    typeof src === 'string' && src.trim().length > 0 ? resolveSrc(src, baseUrl) : undefined
  return <img src={finalSrc} alt={alt} {...rest} />
}
