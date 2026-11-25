import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router'
import { getToiletDetail, searchToilets, submitIssue, submitToiletReport, uploadReportImage } from '../api/toilets'
import { AppHeader } from '../components/AppHeader'
import { CameraCaptureDialog } from '../components/CameraCaptureDialog'
import { Icon } from '../components/Icon'
import { demoToilets } from '../data/demoFixtures'
import type { IssueType, ToiletSummary } from '../types/toilet'
import { isDevelopmentFixture } from '../utils/isDevelopmentFixture'

const categories = [
  { label: '휴지 부족', icon: 'report', description: '휴지가 없거나 부족해요' },
  { label: '시설 고장', icon: 'toilet', description: '시설물이 파손되었어요' },
  { label: '운영시간 오류', icon: 'clock', description: '안내된 운영시간과 달라요' },
  { label: '출입 정보 오류', icon: 'pin', description: '출입 방법 정보가 달라요' },
] as const
const demoMode = import.meta.env.VITE_DEMO_MODE === 'true'

export function UserReportPage() {
  const [params] = useSearchParams()
  const [keyword, setKeyword] = useState('')
  const [results, setResults] = useState<ToiletSummary[]>([])
  const [selected, setSelected] = useState<ToiletSummary | null>(null)
  const [category, setCategory] = useState('')
  const [content, setContent] = useState('')
  const [hygiene, setHygiene] = useState('')
  const [open, setOpen] = useState('')
  const [tissue, setTissue] = useState('false')
  const [searchError, setSearchError] = useState('')
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState<{ kind: 'success' | 'error'; text: string } | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreviewUrl, setImagePreviewUrl] = useState('')
  const [cameraOpen, setCameraOpen] = useState(false)
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null)
  const [cameraLoading, setCameraLoading] = useState(false)
  const [cameraError, setCameraError] = useState('')
  const [pendingImage, setPendingImage] = useState<{ kind: 'TOILET_STATUS' | 'ISSUE'; reportId: number; toiletId: number } | null>(null)
  const imageInputRef = useRef<HTMLInputElement | null>(null)
  const cameraRequestId = useRef(0)

  useEffect(() => {
    if (!imageFile) { setImagePreviewUrl(''); return }
    const preview = URL.createObjectURL(imageFile)
    setImagePreviewUrl(preview)
    return () => URL.revokeObjectURL(preview)
  }, [imageFile])

  useEffect(() => () => { cameraStream?.getTracks().forEach((track) => track.stop()) }, [cameraStream])

  async function requestCamera() {
    const requestId = ++cameraRequestId.current
    setCameraError('')
    if (!window.isSecureContext) {
      setCameraError('카메라는 HTTPS 또는 localhost 주소에서 사용할 수 있습니다.')
      setCameraLoading(false)
      return
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError('이 브라우저는 카메라 기능을 지원하지 않습니다. 파일 선택을 이용해 주세요.')
      setCameraLoading(false)
      return
    }
    setCameraLoading(true)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 960 } },
      })
      if (requestId !== cameraRequestId.current) { stream.getTracks().forEach((track) => track.stop()); return }
      setCameraStream(stream)
    } catch (error) {
      const name = error instanceof DOMException ? error.name : ''
      setCameraError(name === 'NotAllowedError' || name === 'SecurityError'
        ? '카메라 권한이 거부되었습니다. 브라우저 사이트 설정에서 카메라를 허용한 뒤 다시 시도해 주세요.'
        : name === 'NotFoundError'
          ? '사용할 수 있는 카메라를 찾지 못했습니다. 파일 선택으로 사진을 첨부해 주세요.'
          : '카메라를 시작하지 못했습니다. 다른 앱에서 카메라를 사용 중인지 확인해 주세요.')
    } finally { if (requestId === cameraRequestId.current) setCameraLoading(false) }
  }

  function openCamera() {
    cameraRequestId.current += 1
    setCameraOpen(true)
    setCameraStream(null)
    void requestCamera()
  }

  function closeCamera() {
    cameraRequestId.current += 1
    setCameraOpen(false)
    setCameraStream(null)
    setCameraError('')
  }

  function useCapturedPhoto(file: File) {
    setImageFile(file)
    setPendingImage(null)
    setNotice(null)
    closeCamera()
  }

  function removePhoto() {
    setImageFile(null)
    setPendingImage(null)
    if (imageInputRef.current) imageInputRef.current.value = ''
  }

  useEffect(() => {
    const id = params.get('toiletId')
    if (!id) return
    if (demoMode) {
      const match = demoToilets.find((toilet) => toilet.id === Number(id))
      if (match) { setSelected(match); setKeyword(match.name) }
      return
    }
    getToiletDetail(id).then((toilet) => {
      if (isDevelopmentFixture(toilet)) throw new Error('요청하신 정보를 찾을 수 없습니다.')
      setSelected(toilet); setKeyword(toilet.name)
    }).catch((error: unknown) => setSearchError(error instanceof Error ? error.message : '화장실을 불러오지 못했습니다.'))
  }, [params])

  async function search() {
    setSearchError('')
    if (demoMode) {
      const normalized = keyword.trim().toLowerCase()
      setResults(demoToilets.filter((item) => `${item.name} ${item.address}`.toLowerCase().includes(normalized)))
      setSearchError('시연용 예시 결과입니다. 실제 검색은 백엔드 연결 후 이용할 수 있습니다.')
      return
    }
    try { setResults((await searchToilets(keyword.trim())).filter((item) => !isDevelopmentFixture(item))) } catch (error) { setSearchError(error instanceof Error ? error.message : '화장실 검색에 실패했습니다.') }
  }

  async function submit(event: FormEvent) {
    event.preventDefault(); setNotice(null)
    if (!selected || !category || !content.trim()) { setNotice({ kind: 'error', text: '화장실, 제보 유형, 상세 내용을 모두 확인해 주세요.' }); return }
    if (category === '휴지 부족' && (!hygiene || !open)) { setNotice({ kind: 'error', text: '기존 API 등록 요건에 따라 위생 상태와 출입문 개방 여부도 선택해야 합니다.' }); return }
    setBusy(true)
    try {
      if (demoMode) { setNotice({ kind: 'success', text: '시연 모드입니다. 내용은 서버에 저장되지 않았습니다.' }); return }
      let reportId: number
      let reportKind: 'TOILET_STATUS' | 'ISSUE'
      if (category === '휴지 부족') {
        reportKind = 'TOILET_STATUS'
        reportId = await submitToiletReport(selected.id, { hasTissue: tissue === 'true', hygieneStatus: hygiene as 'CLEAN' | 'NORMAL' | 'DIRTY', isOpen: open === 'true', comment: `[${category}] ${content.trim()}` })
      } else {
        const type: IssueType = category === '출입 정보 오류' ? 'WRONG_PASSWORD' : 'OTHER'
        reportKind = 'ISSUE'
        reportId = await submitIssue(selected.id, type, `[${category}] ${content.trim()}`)
      }
      setContent('')
      if (imageFile) {
        try {
          await uploadReportImage(reportKind, reportId, selected.id, imageFile)
          setNotice({ kind: 'success', text: '제보와 사진이 저장되었습니다.' })
          setImageFile(null)
          setPendingImage(null)
        } catch (imageError) {
          setPendingImage({ kind: reportKind, reportId, toiletId: selected.id })
          setNotice({ kind: 'error', text: `제보는 저장됐지만 사진 업로드에 실패했습니다. ${imageError instanceof Error ? imageError.message : ''}` })
        }
      } else {
        setNotice({ kind: 'success', text: '제보가 접수되었습니다. 확인 후 조치하겠습니다.' })
      }
    } catch (error) { setNotice({ kind: 'error', text: error instanceof Error ? error.message : '제보 등록에 실패했습니다.' }) }
    finally { setBusy(false) }
  }

  async function retryImageUpload() {
    if (!pendingImage || !imageFile) return
    setBusy(true)
    try {
      await uploadReportImage(pendingImage.kind, pendingImage.reportId, pendingImage.toiletId, imageFile)
      setImageFile(null); setPendingImage(null)
      setNotice({ kind: 'success', text: '제보 사진이 저장되었습니다.' })
    } catch (error) {
      setNotice({ kind: 'error', text: error instanceof Error ? error.message : '사진 업로드에 실패했습니다.' })
    } finally { setBusy(false) }
  }

  return <div className="app-shell"><AppHeader/><main className="work-page"><nav className="breadcrumb"><Link to="/">홈</Link><span>/</span><span>사용자 제보</span></nav><div className="work-title"><h1>더 정확한 정보, 함께 만들어요</h1><p>현장의 작은 변화도 알려주세요. 확인 후 화장실 정보에 반영합니다.</p></div>
    {demoMode && <div className="demo-banner inline-demo">시연용 화면 · 제출한 내용은 저장되지 않습니다</div>}
    <div className="report-work-grid"><form className="form-card" onSubmit={(event) => void submit(event)}>
    <section className="form-section"><label className="field-label" htmlFor="toilet-find">제보할 화장실 <b>*</b></label><div className="select-toilet-row"><input id="toilet-find" value={keyword} onChange={(event) => setKeyword(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); void search() } }} placeholder="화장실 이름 또는 주소 검색"/><button type="button" className="button button-outline" onClick={() => void search()} aria-label="화장실 검색"><Icon name="search" size={17}/></button></div>
        {searchError && <p className="field-error" role="alert">{searchError}</p>}
        {results.length > 0 && <div className="toilet-options">{results.map((item) => <button key={item.id} type="button" className={`toilet-option ${selected?.id === item.id ? 'selected' : ''}`} onClick={() => setSelected(item)}><strong>{item.name}</strong><span>{item.address}</span></button>)}</div>}
        {selected ? <div className="selected-toilet"><span className="toilet-thumb selected-thumb" aria-label="사진 미등록">▧<small>사진 없음</small></span><div><strong>{selected.name}</strong><span>{selected.address}</span></div><button type="button" onClick={() => setSelected(null)}>변경</button></div> : <p className="field-help">검색 결과에서 제보할 화장실을 선택해 주세요.</p>}
      </section>
      <section className="form-section"><span className="field-label">제보 유형 <b>*</b></span><div className="category-grid">{categories.map((item) => <button type="button" key={item.label} onClick={() => setCategory(item.label)} className={`category-option ${category === item.label ? 'selected' : ''}`}><span><Icon name={item.icon} size={17}/></span><strong>{item.label}</strong><small>{item.description}</small></button>)}</div>
        {category === '휴지 부족' && <div className="required-observation"><p>현장 상태를 함께 알려주세요.</p><div className="compact-fields"><label>위생 상태<select value={hygiene} onChange={(e) => setHygiene(e.target.value)} required><option value="">선택</option><option value="CLEAN">청결</option><option value="NORMAL">보통</option><option value="DIRTY">불량</option></select></label><label>출입문<select value={open} onChange={(e) => setOpen(e.target.value)} required><option value="">선택</option><option value="true">열림</option><option value="false">닫힘</option></select></label><label>휴지 비치<select value={tissue} onChange={(e) => setTissue(e.target.value)}><option value="false">없음</option><option value="true">있음</option></select></label></div></div>}
        <p className="field-help">현장에서 직접 확인한 정보를 선택해 주세요.</p>
      </section>
    <section className="form-section"><label className="field-label" htmlFor="report-content">상세 내용 <b>*</b></label><textarea id="report-content" maxLength={Math.max(1, 500 - (category ? `[${category}] `.length : 0))} rows={5} value={content} onChange={(event) => setContent(event.target.value)} placeholder="발견한 상황을 자세히 적어주세요." required/><div className="text-count">{content.length} / {Math.max(1, 500 - (category ? `[${category}] `.length : 0))}</div></section>
      <section className="form-section"><label className="field-label" htmlFor="report-image">현장 사진</label><div className="report-image-actions"><input ref={imageInputRef} id="report-image" className="report-image-input" type="file" accept="image/jpeg,image/png" onChange={(event) => { const file = event.target.files?.[0] ?? null; if (file && !['image/jpeg', 'image/png'].includes(file.type)) { setImageFile(null); setNotice({ kind: 'error', text: 'JPG 또는 PNG 사진을 선택해 주세요.' }); event.target.value = ''; return } if (file && file.size > 10 * 1024 * 1024) { setImageFile(null); setNotice({ kind: 'error', text: '이미지는 10MB 이하여야 합니다.' }); event.target.value = ''; return } setImageFile(file); setPendingImage(null) }}/><button type="button" className="button button-outline camera-open-button" onClick={openCamera}><Icon name="camera" size={17}/>카메라로 촬영</button></div>{imageFile && imagePreviewUrl && <div className="report-photo-preview"><img src={imagePreviewUrl} alt="제보에 첨부할 사진 미리보기"/><div className="report-photo-details"><strong>{imageFile.name}</strong><span>{(imageFile.size / 1024 / 1024).toFixed(1)}MB · 등록 전에 사진을 확인해 주세요.</span><div><button type="button" className="button button-outline" onClick={openCamera}><Icon name="camera" size={15}/>다시 촬영</button><button type="button" className="button button-quiet" onClick={removePhoto}>첨부 삭제</button></div></div></div>}</section>
      <div className="privacy-note-left" role="note"><span className="privacy-note-icon"><Icon name="shield" size={18}/></span><span className="privacy-note-copy"><strong>사진 등록 전 확인해 주세요.</strong><span>사진에 얼굴, 차량 번호판, 전화번호 등 개인정보가 포함되지 않도록 주의해 주세요.</span></span></div>
      {notice && <div className={`submit-notice ${notice.kind}`} role="status">{notice.text}</div>}
      {pendingImage && imageFile && <button type="button" className="button button-outline retry-image-upload" disabled={busy} onClick={() => void retryImageUpload()}>{busy ? '업로드 중…' : '저장된 제보에 사진 다시 첨부'}</button>}
      <div className="submit-row"><span>등록한 제보는 ‘내 제보’에서 확인할 수 있어요.</span><button className="button button-primary submit-report" disabled={busy}>{busy ? '등록 중…' : '제보 등록'} <span>→</span></button></div>
      {cameraOpen && <CameraCaptureDialog stream={cameraStream} loading={cameraLoading} error={cameraError} onCapture={useCapturedPhoto} onRetry={() => void requestCamera()} onClose={closeCamera}/>}
    </form>
    <aside className="report-help-card"><h2>제보는 이렇게 반영돼요</h2><ol><li><i>1</i><span><strong>제보 접수</strong><small>화장실과 제보 유형을 확인합니다.</small></span></li><li><i>2</i><span><strong>운영자 확인</strong><small>중복 여부와 현장 정보를 검토합니다.</small></span></li><li><i>3</i><span><strong>정보 반영</strong><small>처리 결과는 내 제보에서 확인할 수 있어요.</small></span></li></ol><div className="help-caution"><strong>작성 전 확인해 주세요</strong><span>· 직접 확인한 최신 정보를 작성해 주세요.<br/>· 같은 내용은 반복해서 제보하지 말아 주세요.<br/>· 허위 제보나 개인정보는 반영되지 않습니다.</span></div><Link to="/my-reports">등록한 제보 확인하기 ↗</Link></aside></div>
  </main></div>
}
