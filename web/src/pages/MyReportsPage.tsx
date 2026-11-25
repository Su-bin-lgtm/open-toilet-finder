import { useEffect, useMemo, useState } from 'react'
import { AppHeader } from '../components/AppHeader'
import { getMyReports, getReportImages, type ReportImage } from '../api/toilets'
import { demoMine } from '../data/demoFixtures'
import type { MyReport } from '../types/toilet'
import { formatDateTime } from '../utils/formatDateTime'
import { ReportImageView } from '../components/ReportImageView'

const demoMode = import.meta.env.VITE_DEMO_MODE === 'true'
type Row = (typeof demoMine)[number]
const statusName: Record<string, string> = { RECEIVED: '검토 대기', IN_PROGRESS: '검토 중', RESOLVED: '승인 완료', REJECTED: '반려' }

export function MyReportsPage() {
  const [filter, setFilter] = useState('전체')
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<Row | null>(demoMode ? demoMine[0] : null)
  const rows = useMemo(() => {
    const filtered = demoMine.filter((row) => filter === '전체'
      || (filter === '검토 중' && ['RECEIVED', 'IN_PROGRESS'].includes(row.status))
      || (filter === '처리 완료' && ['RESOLVED', 'REJECTED'].includes(row.status))
      || statusName[row.status] === filter)
    return filtered.sort((a, b) => b.date.localeCompare(a.date))
  }, [filter])
  const pageSize = 5
  const pageRows = rows.slice((page - 1) * pageSize, page * pageSize)
  const counts = { all: demoMine.length, review: demoMine.filter((row) => ['RECEIVED', 'IN_PROGRESS'].includes(row.status)).length, done: demoMine.filter((row) => row.status === 'RESOLVED').length, rejected: demoMine.filter((row) => row.status === 'REJECTED').length }
  const visibleCounts = demoMode ? counts : { all: 0, review: 0, done: 0, rejected: 0 }
  if (!demoMode) return <LiveMyReports />
  return <div className="app-shell"><AppHeader/><main className="work-page my-report-page"><nav className="breadcrumb"><span>홈</span><span>/</span><span>내 제보</span></nav><div className="work-title"><h1>내가 보낸 제보</h1><p>제보 처리 현황과 반영 결과를 확인하세요.</p></div>
    <div className="demo-banner inline-demo">{demoMode ? '시연용 예시 데이터 · 실제 사용자 계정과 연결되지 않았습니다' : '내 제보 조회는 백엔드 사용자 계정 및 조회 API 구현 후 제공됩니다'}</div>
    <section className="stats-grid"><Stat label="전체 제보" count={visibleCounts.all} icon="▤" tone="blue"/><Stat label="검토 중" count={visibleCounts.review} icon="◷" tone="amber"/><Stat label="승인 완료" count={visibleCounts.done} icon="✓" tone="green"/><Stat label="반려" count={visibleCounts.rejected} icon="×" tone="red"/></section>
    <section className="my-reports-layout"><div className="table-card"><div className="table-toolbar"><div className="status-tabs">{['전체', '검토 중', '승인 완료', '반려'].map((item) => <button key={item} className={filter === item ? 'active' : ''} onClick={() => { setFilter(item); setPage(1) }}>{item}{demoMode && <small> {item === '전체' ? counts.all : item === '검토 중' ? counts.review : item === '승인 완료' ? counts.done : counts.rejected}</small>}</button>)}</div><span>최신순 <b>⌄</b></span></div>
      <div className="data-table-wrap"><table className="data-table"><thead><tr><th>제보 화장실</th><th>제보 유형</th><th>내용</th><th>상태</th><th>등록일</th></tr></thead><tbody>
        {demoMode ? pageRows.map((row) => <tr key={row.id} onClick={() => setSelected(row)} className={selected?.id === row.id ? 'selected-row' : ''}><td><strong>{row.toilet}</strong><small>제보 #{row.id}</small></td><td>{row.type}</td><td className="truncate-cell">{row.content}</td><td><StatusBadge status={row.status}/></td><td>{row.date}</td></tr>) : <tr><td colSpan={5} className="unsupported-cell">아직 조회할 수 있는 사용자별 제보 API가 없습니다.</td></tr>}
      </tbody></table></div>
      {demoMode && <div className="pagination"><span>총 {rows.length}건</span><div><button disabled={page === 1} onClick={() => setPage(Math.max(1, page - 1))}>‹</button><button className="current">{page}</button><button disabled={page * pageSize >= rows.length} onClick={() => setPage(page + 1)}>›</button></div></div>}
    </div>
    <aside className="my-detail-card"><div className="detail-card-head"><h2>제보 상세</h2><span>#{selected?.id ?? '—'}</span></div>{selected && demoMode ? <><StatusBadge status={selected.status}/><h3>{selected.type}</h3><div className="detail-info"><span>화장실</span><strong>{selected.toilet}</strong><span>등록일</span><strong>{selected.date}</strong></div><div className="detail-message"><small>제보 내용</small><p>{selected.content}</p></div><div className="detail-message response"><small>처리 결과</small><p>{selected.result}</p></div></> : <div className="detail-empty">제보 상세 정보가 없습니다.<br/>백엔드의 사용자별 제보 조회 기능이 필요합니다.</div>}</aside></section>
  </main></div>
}

function Stat({ label, count, icon, tone }: { label: string; count: number; icon: string; tone: string }) { return <article className="stat-card"><span className={`stat-icon ${tone}`}>{icon}</span><div><small>{label}</small><strong>{count}<i>건</i></strong></div></article> }
function StatusBadge({ status }: { status: string }) { return <span className={`status-badge ${status.toLowerCase()}`}>{statusName[status] || status}</span> }

type LiveRow = { key: string; report: MyReport; date: string }

function LiveMyReports() {
  const [reports, setReports] = useState<MyReport[]>([])
  const [filter, setFilter] = useState('전체')
  const [page, setPage] = useState(1)
  const [selectedKey, setSelectedKey] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedImages, setSelectedImages] = useState<ReportImage[]>([])

  useEffect(() => {
    let active = true
    getMyReports()
      .then((data) => { if (active) { setReports(data); setSelectedKey(data[0] ? `${data[0].reportKind}-${data[0].id}` : null) } })
      .catch((cause: unknown) => { if (active) setError(cause instanceof Error ? cause.message : '내 제보를 불러오지 못했습니다.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  const allRows = useMemo<LiveRow[]>(() => reports.map((report) => ({
    key: `${report.reportKind}-${report.id}`, report, date: formatDateTime(report.createdAt),
  })), [reports])
  const rows = useMemo(() => allRows.filter(({ report }) => filter === '전체'
    || (filter === '검토 중' && report.status !== null && ['RECEIVED', 'IN_PROGRESS'].includes(report.status))
    || (filter === '승인 완료' && report.status === 'RESOLVED')
    || (filter === '반려' && report.status === 'REJECTED'))
    .sort((a, b) => new Date(b.report.createdAt).getTime() - new Date(a.report.createdAt).getTime()), [allRows, filter])
  const selected = allRows.find(({ key }) => key === selectedKey)?.report ?? null

  useEffect(() => {
    let active = true
    if (!selected) { setSelectedImages([]); return }
    getReportImages(selected.reportKind, selected.id)
      .then((images) => { if (active) setSelectedImages(images) })
      .catch(() => { if (active) setSelectedImages([]) })
    return () => { active = false }
  }, [selected?.reportKind, selected?.id])
  const pageSize = 5
  const pageRows = rows.slice((page - 1) * pageSize, page * pageSize)
  const counts = {
    all: reports.length,
    review: reports.filter((row) => row.status !== null && ['RECEIVED', 'IN_PROGRESS'].includes(row.status)).length,
    done: reports.filter((row) => row.status === 'RESOLVED').length,
    rejected: reports.filter((row) => row.status === 'REJECTED').length,
  }

  return <div className="app-shell"><AppHeader/><main className="work-page my-report-page"><nav className="breadcrumb"><span>홈</span><span>/</span><span>내 제보</span></nav><div className="work-title"><h1>내가 보낸 제보</h1><p>제보 처리 현황과 반영 결과를 확인하세요.</p></div>
    <div className="demo-banner inline-demo">이 기기에서 작성한 제보 내역을 보여드립니다.</div>
    <section className="stats-grid"><Stat label="전체 제보" count={counts.all} icon="▤" tone="blue"/><Stat label="검토 중" count={counts.review} icon="◷" tone="amber"/><Stat label="승인 완료" count={counts.done} icon="✓" tone="green"/><Stat label="반려" count={counts.rejected} icon="×" tone="red"/></section>
    <section className="my-reports-layout"><div className="table-card"><div className="table-toolbar"><div className="status-tabs">{['전체', '검토 중', '승인 완료', '반려'].map((item) => <button key={item} className={filter === item ? 'active' : ''} onClick={() => { setFilter(item); setPage(1) }}>{item}</button>)}</div><span>최신순 <b>⌄</b></span></div>
      <div className="data-table-wrap"><table className="data-table"><thead><tr><th>제보 화장실</th><th>제보 유형</th><th>내용</th><th>상태</th><th>등록일</th></tr></thead><tbody>
        {loading ? <tr><td colSpan={5} className="unsupported-cell">내 제보를 불러오는 중입니다.</td></tr>
          : error ? <tr><td colSpan={5} className="unsupported-cell" role="alert">{error}</td></tr>
            : pageRows.length ? pageRows.map(({ key, report, date }) => <tr key={key} onClick={() => setSelectedKey(key)} className={selectedKey === key ? 'selected-row' : ''}><td><strong>{report.toilet.name}</strong><small>제보 #{report.id}</small></td><td>{report.type}</td><td className="truncate-cell">{report.content}</td><td>{report.status ? <StatusBadge status={report.status}/> : <span className="status-badge submitted">접수 완료</span>}</td><td>{date}</td></tr>)
              : <tr><td colSpan={5} className="unsupported-cell">이 브라우저에서 등록한 제보가 없습니다.</td></tr>}
      </tbody></table></div>
      {rows.length > pageSize && <div className="pagination"><span>총 {rows.length}건</span><div><button disabled={page === 1} onClick={() => setPage(Math.max(1, page - 1))}>‹</button><button className="current">{page}</button><button disabled={page * pageSize >= rows.length} onClick={() => setPage(page + 1)}>›</button></div></div>}
    </div>
    <aside className="my-detail-card"><div className="detail-card-head"><h2>제보 상세</h2><span>#{selected?.id ?? '—'}</span></div>{selected ? <><div>{selected.status ? <StatusBadge status={selected.status}/> : <span className="status-badge submitted">접수 완료</span>}</div><h3>{selected.type}</h3><div className="detail-info"><span>화장실</span><strong>{selected.toilet.name}</strong><span>주소</span><strong>{selected.toilet.address}</strong><span>등록일</span><strong>{formatDateTime(selected.createdAt)}</strong></div><div className="detail-message"><small>제보 내용</small><p>{selected.content}</p></div><div className="detail-message response"><small>처리 결과</small><p>{selected.reviewMemo || (selected.status ? `현재 처리 상태: ${statusName[selected.status]}` : '현장 상태 제보의 별도 처리 상태는 아직 제공되지 않습니다.')}</p></div>{selectedImages.length > 0 && <div className="report-image-list"><strong>첨부 사진</strong>{selectedImages.map((image) => <ReportImageView key={image.id} imageId={image.id} alt="제보 첨부 사진"/>)}</div>}</> : <div className="detail-empty">제보 상세 정보가 없습니다.<br/>이 브라우저의 기기 ID로 등록한 제보를 표시합니다.</div>}</aside></section>
  </main></div>
}
