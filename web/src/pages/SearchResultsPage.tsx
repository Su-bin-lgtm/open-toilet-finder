import { useEffect, useState } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router'
import { findNearbyToilets, searchToilets } from '../api/toilets'
import { ApiNotice } from '../components/ApiNotice'
import { AppHeader } from '../components/AppHeader'
import { ToiletCard } from '../components/ToiletCard'
import type { Coordinates, SearchCriteria, ToiletSummary } from '../types/toilet'
import { isDevelopmentFixture } from '../utils/isDevelopmentFixture'

type LoadState = 'loading' | 'ready' | 'error'

export function SearchResultsPage() {
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const state = location.state as Partial<SearchCriteria> | null
  const keyword = searchParams.get('keyword')?.trim() || ''
  const nearbyCoordinates = state?.kind === 'nearby' && state.coordinates
    ? state.coordinates as Coordinates
    : null
  const [toilets, setToilets] = useState<ToiletSummary[]>([])
  const [loadState, setLoadState] = useState<LoadState>('loading')
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)

  useEffect(() => {
    let isCurrent = true
    setLoadState('loading')
    setError(null)

    const request = nearbyCoordinates
      ? findNearbyToilets(nearbyCoordinates)
      : keyword
        ? searchToilets(keyword)
        : Promise.reject(new Error('검색어를 입력하거나 현재 위치 검색을 다시 시작해 주세요.'))

    request.then((results) => {
      if (isCurrent) {
        setToilets(results.filter((item) => !isDevelopmentFixture(item)))
        setLoadState('ready')
      }
    }).catch((requestError: unknown) => {
      if (isCurrent) {
        setError(requestError instanceof Error ? requestError.message : '검색 요청에 실패했습니다.')
        setLoadState('error')
      }
    })

    return () => { isCurrent = false }
  }, [keyword, nearbyCoordinates, retryCount])

  const title = nearbyCoordinates ? '내 주변 화장실' : `“${keyword}” 검색 결과`

  return (
    <div className="app-shell">
      <AppHeader />
      <main className="content-page">
        <Link className="back-link" to="/">← <span>검색으로 돌아가기</span></Link>
        <div className="page-heading">
          <div>
            <span className="eyebrow">OPEN TOILET FINDER</span>
            <h1>{title}</h1>
            <p className="muted">현재 검색 위치에서 이용할 수 있는 화장실을 확인해 보세요.</p>
          </div>
          <span className="result-count">
            {loadState === 'ready' ? `${toilets.length}곳` : loadState === 'loading' ? '검색 중' : '조회 실패'}
          </span>
        </div>

        {loadState === 'loading' && <div className="state-panel"><span className="spinner" />화장실 정보를 불러오고 있습니다.</div>}
        {loadState === 'error' && (
          <div className="state-panel state-error" role="alert">
            <span className="state-icon">!</span>
            <h2>검색 결과를 불러오지 못했습니다.</h2>
            <p>{error}</p>
            <p className="muted">잠시 후 다시 시도하거나 다른 검색어를 입력해 주세요.</p>
            <button className="button button-primary retry-button" type="button" onClick={() => setRetryCount((count) => count + 1)}>
              다시 시도
            </button>
          </div>
        )}
        {loadState === 'ready' && toilets.length === 0 && (
          <div className="state-panel">
            <span className="state-icon">⌕</span>
            <h2>검색 결과가 없습니다.</h2>
            <p>다른 검색어를 입력하거나 검색 위치를 바꿔보세요.</p>
          </div>
        )}
        {loadState === 'ready' && toilets.length > 0 && (
          <div className="toilet-list">{toilets.map((toilet) => <ToiletCard key={toilet.id} toilet={toilet} />)}</div>
        )}
        <ApiNotice />
      </main>
    </div>
  )
}
