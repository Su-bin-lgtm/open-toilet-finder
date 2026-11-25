import { Link } from 'react-router'
import { AppHeader } from '../components/AppHeader'

export function NotFoundPage() {
  return (
    <div className="app-shell">
      <AppHeader />
      <main className="state-panel not-found">
        <span className="state-icon">?</span>
        <h1>페이지를 찾을 수 없습니다.</h1>
        <Link className="button button-primary" to="/">메인으로 이동</Link>
      </main>
    </div>
  )
}
