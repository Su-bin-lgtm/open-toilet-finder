import { Link, NavLink } from 'react-router'
import { Icon } from './Icon'
import { useAuth } from '../hooks/AuthContext'

export function AppHeader() {
  const { user } = useAuth()
  return (
    <header className="site-header">
      <Link className="brand" to="/" aria-label="OpenToilet 홈">
        <span className="brand-mark" aria-hidden="true">OT</span>
        <span className="brand-copy">
          <strong>Open Toilet Finder</strong>
          <small>가까운 개방화장실 찾기</small>
        </span>
      </Link>
      <nav className="main-nav" aria-label="주 메뉴">
        <NavLink to="/" end><Icon name="pin" size={16}/><span>주변 화장실</span></NavLink>
        <NavLink to="/report"><Icon name="report" size={16}/><span>사용자 제보</span></NavLink>
        <NavLink to="/my-reports"><Icon name="list" size={16}/><span>내 제보</span></NavLink>
        <NavLink to="/admin/reports"><Icon name="report" size={16}/><span>관리자</span></NavLink>
      </nav>
      <Link className="user-menu" to="/account"><Icon name="user" size={16}/><span className="user-menu-label">{user?.username ?? '계정'}</span></Link>
    </header>
  )
}
