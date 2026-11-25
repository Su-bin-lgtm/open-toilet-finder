import { useEffect, useRef, useState } from 'react'
import { Icon } from './Icon'

interface CameraCaptureDialogProps {
  stream: MediaStream | null
  loading: boolean
  error: string
  onCapture: (file: File) => void
  onRetry: () => void
  onClose: () => void
}

export function CameraCaptureDialog({ stream, loading, error, onCapture, onRetry, onClose }: CameraCaptureDialogProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const [captureError, setCaptureError] = useState('')

  useEffect(() => {
    if (!videoRef.current) return
    videoRef.current.srcObject = stream
    if (stream) void videoRef.current.play().catch(() => undefined)
    return () => {
      if (videoRef.current) videoRef.current.srcObject = null
    }
  }, [stream])

  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [onClose])

  function capture() {
    const video = videoRef.current
    if (!video || !video.videoWidth || !video.videoHeight) return
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const context = canvas.getContext('2d')
    if (!context) return
    context.drawImage(video, 0, 0, canvas.width, canvas.height)
    canvas.toBlob((blob) => {
      if (!blob) return
      if (blob.size > 10 * 1024 * 1024) {
        setCaptureError('촬영한 사진이 10MB를 초과합니다. 다시 촬영해 주세요.')
        return
      }
      onCapture(new File([blob], `toilet-report-${Date.now()}.jpg`, { type: 'image/jpeg', lastModified: Date.now() }))
    }, 'image/jpeg', 0.88)
  }

  return <div className="camera-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
    <section className="camera-dialog" role="dialog" aria-modal="true" aria-labelledby="camera-dialog-title">
      <div className="camera-dialog-head"><div><h2 id="camera-dialog-title">현장 사진 촬영</h2><p>개인정보가 보이지 않도록 촬영 전에 확인해 주세요.</p></div><button type="button" className="camera-close" onClick={onClose} aria-label="카메라 닫기">×</button></div>
      {stream ? <video ref={videoRef} className="camera-preview" autoPlay playsInline muted aria-label="카메라 미리보기"/> : <div className="camera-unavailable"><Icon name="camera" size={28}/><strong>{loading ? '카메라를 준비하고 있습니다.' : '카메라를 사용할 수 없습니다.'}</strong></div>}
      {(captureError || error) && <p className="camera-dialog-error" role="alert">{captureError || error}</p>}
      <div className="camera-dialog-actions">
        {error && <button type="button" className="button button-outline" onClick={onRetry} disabled={loading}>{loading ? '확인 중…' : '권한 다시 요청'}</button>}
        <button type="button" className="button button-outline" onClick={onClose}>파일로 첨부</button>
        <button type="button" className="button button-primary" onClick={capture} disabled={!stream || loading}><Icon name="camera" size={17}/>사진 촬영</button>
      </div>
    </section>
  </div>
}
