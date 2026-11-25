import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'
import { getToiletDetail } from '../api/toilets'
import { ApiNotice } from '../components/ApiNotice'
import { AppHeader } from '../components/AppHeader'
import type { ToiletDetail } from '../types/toilet'
import { formatDateTime } from '../utils/formatDateTime'
import { isDevelopmentFixture } from '../utils/isDevelopmentFixture'

function Facility({ label, available }: { label: string; available: boolean | null }) {
  return (
    <div className="facility-row">
      <span>{label}</span>
      <strong className={available === true ? 'facility-yes' : 'facility-neutral'}>
        {available === null ? '정보 없음' : available ? '있음' : '없음'}
      </strong>
    </div>
  )
}

export function ToiletDetailPage() {
  const { id = '' } = useParams()
  const [toilet, setToilet] = useState<ToiletDetail | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [retryCount, setRetryCount] = useState(0)

  useEffect(() => {
    let isCurrent = true
    setIsLoading(true)
    setError(null)
    setToilet(null)
    getToiletDetail(id).then((result) => {
      if (isDevelopmentFixture(result)) throw new Error('요청하신 정보를 찾을 수 없습니다.')
      if (isCurrent) setToilet(result)
    }).catch((requestError: unknown) => {
      if (isCurrent) setError(requestError instanceof Error ? requestError.message : '상세 정보를 불러오지 못했습니다.')
    }).finally(() => {
      if (isCurrent) setIsLoading(false)
    })
    return () => { isCurrent = false }
  }, [id, retryCount])

  return (
    <div className="app-shell">
      <AppHeader />
      <main className="content-page detail-page">
        <Link className="back-link" to="/">← <span>검색으로 돌아가기</span></Link>
        {isLoading && <div className="state-panel"><span className="spinner" />상세 정보를 불러오고 있습니다.</div>}
        {!isLoading && error && (
          <div className="state-panel state-error" role="alert">
            <span className="state-icon">!</span>
            <h2>상세 정보를 불러오지 못했습니다.</h2>
            <p>{error}</p>
            <p className="muted">네트워크 상태를 확인한 뒤 다시 시도해 주세요.</p>
            <button className="button button-primary retry-button" type="button" onClick={() => setRetryCount((count) => count + 1)}>
              다시 시도
            </button>
          </div>
        )}
        {!isLoading && toilet && <>
          <section className="detail-heading">
            <span className={`open-pill ${toilet.isOpenNow === null ? 'is-unknown' : toilet.isOpenNow ? 'is-open' : 'is-closed'}`}>
              {toilet.isOpenNow === null ? '운영 정보 확인 중' : toilet.isOpenNow ? '현재 이용 가능' : '현재 운영 종료'}
            </span>
            <h1>{toilet.name}</h1>
            <p className="muted">{toilet.address}</p>
            <div className="detail-hours"><span>운영시간</span><strong>{toilet.openTimeInfo || '운영시간 정보 없음'}</strong></div>
          </section>

          <section className="detail-grid">
            <article className="detail-card">
              <div className="section-title"><span className="section-icon">＋</span><h2>편의시설</h2></div>
              <Facility label="장애인 화장실" available={toilet.hasDisabledToilet} />
              <Facility label="기저귀 교환대" available={toilet.hasDiaperTable} />
              <Facility label="휴지 비치" available={toilet.hasTissue} />
              <Facility label="남녀 공용" available={toilet.isUnisex} />
              <Facility label="비상벨" available={toilet.emergencyBell} />
              <Facility label="CCTV" available={toilet.cctvInstalled} />
              <div className="facility-row"><span>남성 대변기</span><strong>{toilet.maleWaterClosetCount ?? '정보 없음'}</strong></div>
              <div className="facility-row"><span>남성 소변기</span><strong>{toilet.maleUrinalCount ?? '정보 없음'}</strong></div>
              <div className="facility-row"><span>여성 대변기</span><strong>{toilet.femaleWaterClosetCount ?? '정보 없음'}</strong></div>
            </article>

            <article className="detail-card reports-card">
              <div className="section-title"><span className="section-icon">◷</span><h2>최근 제보</h2></div>
              {toilet.recentReports.length === 0 ? (
                <div className="report-empty">아직 등록된 최근 제보가 없습니다.</div>
              ) : (
                <ul className="report-list">
                  {toilet.recentReports.map((report) => (
                    <li className="report-item" key={report.id}>
                      <div className="report-meta">
                        <span>{report.hygieneStatus || '상태 정보 없음'}</span>
                        <time>{formatDateTime(report.createdAt)}</time>
                      </div>
                      <p className="report-facts">
                        휴지 {report.hasTissue === null ? '정보 없음' : report.hasTissue ? '있음' : '없음'}
                        <span> · </span>
                        출입문 {report.isOpen === null ? '정보 없음' : report.isOpen ? '열림' : '닫힘'}
                      </p>
                      <p>{report.comment || '추가 메모가 없습니다.'}</p>
                    </li>
                  ))}
                </ul>
              )}
            </article>
          </section>
          <ApiNotice />
        </>}
      </main>
    </div>
  )
}
