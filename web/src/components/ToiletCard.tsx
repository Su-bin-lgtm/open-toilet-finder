import { Link } from 'react-router'
import type { ToiletSummary } from '../types/toilet'

interface ToiletCardProps {
  toilet: ToiletSummary
}

export function ToiletCard({ toilet }: ToiletCardProps) {
  return (
    <Link className="toilet-card" to={`/toilets/${toilet.id}`}>
      <div className="toilet-card-topline">
        <span className={`open-pill ${toilet.isOpenNow === null ? 'is-unknown' : toilet.isOpenNow ? 'is-open' : 'is-closed'}`}>
          {toilet.isOpenNow === null ? '운영 정보 확인 중' : toilet.isOpenNow ? '현재 이용 가능' : '현재 운영 종료'}
        </span>
        {toilet.distanceMeter !== null && <span className="distance">{toilet.distanceMeter}m</span>}
      </div>
      <h2>{toilet.name}</h2>
      <p className="muted">{toilet.address}</p>
      <div className="card-footer">
        <span>운영시간</span>
        <strong>{toilet.openTimeInfo || '운영시간 정보 없음'}</strong>
        <span className="card-arrow" aria-hidden="true">→</span>
      </div>
    </Link>
  )
}
