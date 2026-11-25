import { useEffect, useState } from 'react'
import { loadReportImage } from '../api/toilets'

export function ReportImageView({ imageId, authorization, alt }: { imageId: number; authorization?: string; alt: string }) {
  const [url, setUrl] = useState<string | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    let objectUrl: string | null = null
    loadReportImage(imageId, authorization)
      .then((blob) => {
        if (!active) return
        objectUrl = URL.createObjectURL(blob)
        setUrl(objectUrl)
      })
      .catch((cause: unknown) => { if (active) setError(cause instanceof Error ? cause.message : '사진을 불러오지 못했습니다.') })
    return () => {
      active = false
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [imageId, authorization])

  if (error) return <p className="field-error" role="status">{error}</p>
  if (!url) return <p className="field-help">사진을 불러오는 중입니다.</p>
  return <img className="report-image-preview" src={url} alt={alt} loading="lazy" />
}
