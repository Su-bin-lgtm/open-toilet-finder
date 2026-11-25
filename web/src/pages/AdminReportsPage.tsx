import { useEffect, useMemo, useRef, useState } from 'react'
import { getIssueReports, getReportImages, importToiletData, updateIssueStatus, type DataImportResult, type ReportImage } from '../api/toilets'
import { AppHeader } from '../components/AppHeader'
import { ReportImageView } from '../components/ReportImageView'
import { demoIssueReports } from '../data/demoFixtures'
import type { IssueReport, IssueStatus, IssueType } from '../types/toilet'

const demoMode = import.meta.env.VITE_DEMO_MODE === 'true'
const statusLabels: Record<IssueStatus, string> = { RECEIVED: '검토 대기', IN_PROGRESS: '검토 중', RESOLVED: '승인 완료', REJECTED: '반려' }
const typeLabels: Record<IssueType, string> = { CLOSED: '폐쇄·운영', WRONG_LOCATION: '위치 오류', WRONG_PASSWORD: '출입 정보', OTHER: '기타' }
const reportCategories = ['휴지 부족', '시설 고장', '운영시간 오류', '출입 정보 오류']

function reportType(item: IssueReport) {
  const category = /^\[([^\]]+)\]/.exec(item.content)?.[1]
  return category || typeLabels[item.issueType] || item.issueType
}

export function AdminReportsPage() {
  const [reports, setReports] = useState<IssueReport[]>(demoMode ? demoIssueReports : [])
  const [selectedId, setSelectedId] = useState<number | null>(demoMode ? demoIssueReports[0].id : null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('전체 상태')
  const [typeFilter, setTypeFilter] = useState('전체 유형')
  const [duplicate, setDuplicate] = useState(false)
  const [inappropriate, setInappropriate] = useState(false)
  const [memo, setMemo] = useState('')
  const [correctionField, setCorrectionField] = useState('')
  const [correctionValue, setCorrectionValue] = useState('')
  const [actionMessage, setActionMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [authorization, setAuthorization] = useState('')
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importBusy, setImportBusy] = useState(false)
  const [importResult, setImportResult] = useState<DataImportResult | null>(null)
  const [importError, setImportError] = useState('')
  const [selectedImages, setSelectedImages] = useState<ReportImage[]>([])
  const importInput = useRef<HTMLInputElement | null>(null)

  async function load(auth = authorization) {
    if (demoMode) return
    if (!auth) return
    setLoading(true); setError('')
    try { const data = await getIssueReports(undefined, auth); setReports(data); setSelectedId((current) => current ?? data[0]?.id ?? null) }
    catch (cause) {
      const message = cause instanceof Error ? cause.message : '제보 목록을 불러오지 못했습니다.'
      if (message.includes('HTTP 401')) {
        setAuthorization('')
        setError('관리자 인증에 실패했습니다. 아이디와 비밀번호를 다시 확인해 주세요.')
      } else setError(message)
    }
    finally { setLoading(false) }
  }
  async function signIn(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const token = basicAuthorization(username, password)
    setAuthorization(token)
    setPassword('')
    await load(token)
  }
  async function importFileSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!importFile) { setImportError('가져올 CSV 또는 JSON 파일을 선택해 주세요.'); return }
    setImportBusy(true); setImportError(''); setImportResult(null)
    try {
      setImportResult(await importToiletData(importFile, authorization))
      setImportFile(null)
      if (importInput.current) importInput.current.value = ''
      await load()
    } catch (cause) { setImportError(cause instanceof Error ? cause.message : '데이터 파일을 가져오지 못했습니다.') }
    finally { setImportBusy(false) }
  }
  const selected = reports.find((item) => item.id === selectedId) ?? null
  useEffect(() => {
    let active = true
    if (!selected || !authorization || demoMode) { setSelectedImages([]); return }
    getReportImages('ISSUE', selected.id, authorization)
      .then((images) => { if (active) setSelectedImages(images) })
      .catch(() => { if (active) setSelectedImages([]) })
    return () => { active = false }
  }, [selected?.id, authorization])
  const filtered = useMemo(() => reports.filter((item) => {
    const statusMatch = statusFilter === '전체 상태' || statusLabels[item.status] === statusFilter
    const typeMatch = typeFilter === '전체 유형' || reportType(item) === typeFilter
    const phrase = `${item.toilet?.name ?? ''} ${item.toilet?.address ?? ''} ${item.content} ${item.id}`.toLowerCase()
    return statusMatch && typeMatch && phrase.includes(query.toLowerCase())
  }).sort((a, b) => b.createdAt.localeCompare(a.createdAt)), [reports, statusFilter, typeFilter, query])
  const counts = { all: reports.length, waiting: reports.filter((x) => x.status === 'RECEIVED').length, done: reports.filter((x) => x.status === 'RESOLVED').length, rejected: reports.filter((x) => x.status === 'REJECTED').length }

  async function decide(status: IssueStatus) {
    if (!selected) return
    setBusy(true); setActionMessage('')
    try {
      if (demoMode) setReports((items) => items.map((item) => item.id === selected.id ? { ...item, status } : item))
      else {
        if (correctionField && status !== 'RESOLVED') throw new Error('화장실 정보 수정은 승인 처리에서만 가능합니다.')
        if (correctionField && !correctionValue.trim()) throw new Error('반영할 정보 값을 입력해 주세요.')
        const review: { reviewMemo?: string; toiletUpdates?: Record<string, boolean | string> } = {}
        if (memo.trim()) review.reviewMemo = memo.trim()
        if (correctionField && correctionValue.trim()) {
          const booleanFields = ['hasTissue', 'hasDisabledToilet', 'hasDiaperTable', 'isUnisex']
          review.toiletUpdates = { [correctionField]: booleanFields.includes(correctionField) ? correctionValue === 'true' : correctionValue.trim() }
        }
        await updateIssueStatus(selected.id, status, authorization, review)
        await load()
      }
      setActionMessage(demoMode ? `시연 데이터 상태를 ${statusLabels[status]}으로 변경했습니다. 서버에는 저장되지 않았습니다.` : `${statusLabels[status]} 상태와 처리 내용이 저장되었습니다.${correctionField ? ' 확인된 화장실 정보도 반영했습니다.' : ''}`)
    } catch (cause) { setActionMessage(cause instanceof Error ? cause.message : '상태를 변경하지 못했습니다.') }
    finally { setBusy(false) }
  }

  return <div className="app-shell"><AppHeader/><main className="work-page admin-page"><nav className="breadcrumb"><span>관리자</span><span>/</span><span>제보 관리</span></nav><div className="work-title admin-title"><div><h1>사용자 제보 관리</h1><p>접수된 제보를 검토하고 정확한 화장실 정보를 유지하세요.</p></div><span className="admin-warning">{demoMode ? '시연 데이터' : '관리자 인증 필요'}</span></div>
    <div className="demo-banner inline-demo">{demoMode ? '시연용 예시 제보입니다. 처리 내용은 저장되지 않습니다.' : '관리자 계정으로 로그인하면 제보를 검토하고 처리할 수 있습니다.'}</div>
    {!demoMode && !authorization && <form className="admin-login" onSubmit={(event) => void signIn(event)}><label>관리자 아이디<input autoComplete="username" value={username} onChange={(event) => setUsername(event.target.value)} required/></label><label>비밀번호<input type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required/></label><button className="button button-primary" disabled={loading}>인증 후 제보 목록 불러오기</button>{error && <p className="error-copy" role="alert">{error}</p>}</form>}
    {(demoMode || authorization) && <>
    {!demoMode && <form className="admin-import" onSubmit={(event) => void importFileSubmit(event)}><div><strong>공공데이터 가져오기</strong><small>컬럼명이 포함된 CSV 또는 JSON 파일 · 최대 25MB · 중복은 건너뜁니다.</small></div><input ref={importInput} type="file" accept=".csv,.json,application/json,text/csv" onChange={(event) => { setImportFile(event.target.files?.[0] ?? null); setImportError(''); setImportResult(null) }}/><button className="button button-outline" disabled={importBusy || !importFile}>{importBusy ? '가져오는 중…' : '데이터 가져오기'}</button>{importError && <p className="error-copy" role="alert">{importError}</p>}{importResult && <div className="import-result" role="status">적재 {importResult.imported}건 · 중복 {importResult.duplicates}건 · 제외 {importResult.skipped}건{importResult.errors.length > 0 && <details><summary>행 오류 {importResult.errors.length}건 보기</summary><ul>{importResult.errors.map((item) => <li key={item}>{item}</li>)}</ul></details>}</div>}</form>}
    <section className="stats-grid"><Stat label="전체 제보" count={counts.all} icon="▤" tone="blue"/><Stat label="검토 대기" count={counts.waiting} icon="◷" tone="amber"/><Stat label="승인 완료" count={counts.done} icon="✓" tone="green"/><Stat label="반려" count={counts.rejected} icon="×" tone="red"/></section>
    <section className="admin-work-layout"><div className="admin-list-card"><div className="admin-filters"><label className="admin-search"><span>⌕</span><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="화장실 이름 또는 제보 내용 검색"/></label><select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} aria-label="상태 필터"><option>전체 상태</option>{Object.values(statusLabels).map((item) => <option key={item}>{item}</option>)}</select></div><div className="admin-type-filters">{['전체 유형', ...reportCategories].map((item) => <button type="button" key={item} className={typeFilter === item ? 'active' : ''} onClick={() => setTypeFilter(item)}>{item}</button>)}</div>
      {loading ? <div className="admin-state"><span className="spinner"/>제보 목록을 불러오는 중입니다.</div> : error ? <div className="admin-state error-copy" role="alert">{error}<button onClick={() => void load()}>다시 시도</button></div> : <div className="data-table-wrap"><table className="data-table admin-table"><thead><tr><th>접수일</th><th>화장실 이름</th><th>제보 유형</th><th>확인 필요</th><th>상태</th><th>상세</th></tr></thead><tbody>{filtered.length ? filtered.map((item) => <tr key={item.id} onClick={() => { setSelectedId(item.id); setMemo(''); setDuplicate(false); setInappropriate(false); setActionMessage('') }} className={selectedId === item.id ? 'selected-row' : ''}><td>{formatShortDate(item.createdAt)}</td><td><strong>{item.toilet?.name || `화장실 #${item.toilet?.id ?? '?'}`}</strong></td><td>{reportType(item)}</td><td>—</td><td><StatusBadge status={item.status}/></td><td><button className="review-row-button" type="button">검토 ›</button></td></tr>) : <tr><td colSpan={6} className="unsupported-cell">표시할 제보가 없습니다.</td></tr>}</tbody></table></div>}
      <div className="pagination"><span>{filtered.length}건</span><div><button className="current" disabled>1</button></div></div></div>
    <aside className="admin-detail-card"><div className="detail-card-head"><h2>제보 상세 검토</h2><span>{selected ? `#${selected.id}` : '선택 없음'}</span></div>{selected ? <><StatusBadge status={selected.status}/><div className="admin-toilet"><small>제보 대상</small><strong>{selected.toilet?.name || '화장실 정보 없음'}</strong><span>{selected.toilet?.address || ''}</span></div><div className="detail-message"><small>제보 내용</small><p>{selected.content}</p></div>{selectedImages.length > 0 && <div className="report-image-list"><strong>첨부 사진</strong>{selectedImages.map((image) => <ReportImageView key={image.id} imageId={image.id} authorization={authorization} alt="제보 첨부 사진"/>)}</div>}{selected.reviewMemo && <div className="detail-message"><small>이전 처리 메모 · {selected.reviewedAt ? formatShortDate(selected.reviewedAt) : ''}</small><p>{selected.reviewMemo}</p></div>}<div className="review-checks"><label><input type="checkbox" checked={duplicate} onChange={(e) => setDuplicate(e.target.checked)}/> 중복 제보 여부 확인</label><label><input type="checkbox" checked={inappropriate} onChange={(e) => setInappropriate(e.target.checked)}/> 허위·부적절한 내용 확인</label></div><label className="field-label" htmlFor="admin-memo">처리 메모</label><textarea id="admin-memo" rows={3} maxLength={500} value={memo} onChange={(e) => setMemo(e.target.value)} placeholder="검토 및 처리 내용을 입력하세요."/><label className="field-label" htmlFor="toilet-correction">확인된 화장실 정보 반영 <small>승인 시 적용</small></label><select id="toilet-correction" value={correctionField} onChange={(e) => { setCorrectionField(e.target.value); setCorrectionValue('') }}><option value="">정보 변경 없음</option><option value="hasTissue">휴지 비치</option><option value="hasDisabledToilet">장애인 화장실</option><option value="hasDiaperTable">기저귀 교환대</option><option value="isUnisex">남녀 공용</option><option value="openTimeInfo">운영시간</option><option value="doorLockCode">출입 안내</option></select>{correctionField && (['hasTissue', 'hasDisabledToilet', 'hasDiaperTable', 'isUnisex'].includes(correctionField) ? <select aria-label="반영 값" value={correctionValue} onChange={(e) => setCorrectionValue(e.target.value)}><option value="">값 선택</option><option value="true">있음</option><option value="false">없음</option></select> : <input aria-label="반영 값" maxLength={correctionField === 'openTimeInfo' ? 150 : 100} value={correctionValue} onChange={(e) => setCorrectionValue(e.target.value)} placeholder="확인된 정보를 입력하세요."/>)}<p className="unsupported-note">검토 체크는 화면에만 남습니다. 메모는 서버에 저장되며 정보 수정은 승인 시에만 적용됩니다.</p>{actionMessage && <div className="submit-notice" role="status">{actionMessage}</div>}<div className="admin-actions"><button className="button button-reject" disabled={busy} onClick={() => void decide('REJECTED')}>반려</button><button className="button button-primary" disabled={busy} onClick={() => void decide('RESOLVED')}>승인 및 정보 반영</button></div></> : <div className="detail-empty">선택된 제보가 없습니다.</div>}</aside></section>
    </>}
  </main></div>
}

function basicAuthorization(username: string, password: string) {
  const bytes = new TextEncoder().encode(`${username}:${password}`)
  let binary = ''
  bytes.forEach((byte) => { binary += String.fromCharCode(byte) })
  return `Basic ${btoa(binary)}`
}

function Stat({ label, count, icon, tone }: { label: string; count: number; icon: string; tone: string }) { return <article className="stat-card"><span className={`stat-icon ${tone}`}>{icon}</span><div><small>{label}</small><strong>{count}<i>건</i></strong></div></article> }
function StatusBadge({ status }: { status: IssueStatus }) { return <span className={`status-badge ${status.toLowerCase()}`}>{statusLabels[status]}</span> }
function formatShortDate(value: string) { const date = new Date(value); return Number.isNaN(date.valueOf()) ? value : `${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}` }
