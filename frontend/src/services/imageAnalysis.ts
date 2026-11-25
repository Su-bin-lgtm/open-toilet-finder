export interface ToiletImageAnalysis {
  detectedObjects: Array<{ label: string; confidence: number; box?: [number, number, number, number] }>
  hygieneSignals: string[]
}

export async function uploadImageForAnalysis(baseUrl: string, toiletId: number, uri: string): Promise<ToiletImageAnalysis> {
  const file = { uri, name: 'toilet-photo.jpg', type: 'image/jpeg' } as unknown as Blob
  const form = new FormData()
  form.append('file', file)
  let response: Response
  try {
    response = await fetch(`${baseUrl.replace(/\/$/, '')}/toilets/${toiletId}/images/analyze`, { method: 'POST', body: form })
  } catch {
    throw new Error('사진 분석 API에 연결하지 못했습니다. 서버 주소와 네트워크를 확인해 주세요.')
  }
  const payload = await response.json().catch(() => null) as { success?: boolean; message?: string; data?: ToiletImageAnalysis } | null
  if (!response.ok || !payload?.success || !payload.data) {
    throw new Error(payload?.message || (response.status === 503
      ? 'YOLOv8 모델 가중치가 아직 연결되지 않았습니다.'
      : `사진 분석 요청 실패 (HTTP ${response.status})`))
  }
  return payload.data
}
