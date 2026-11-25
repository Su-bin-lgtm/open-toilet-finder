import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { AppHeader } from '../components/AppHeader'
import { useAuth } from '../hooks/AuthContext'

export function AccountPage() {
  const { user, login, register, logout } = useAuth()
  const navigate = useNavigate()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  async function submit(event: FormEvent) {
    event.preventDefault(); setBusy(true); setMessage('')
    try {
      if (mode === 'login') await login(username, password)
      else await register(username, password)
      setPassword(''); navigate('/my-reports')
    } catch (cause) { setMessage(cause instanceof Error ? cause.message : '계정 요청을 처리하지 못했습니다.') }
    finally { setBusy(false) }
  }
  async function signOut() {
    setBusy(true)
    try { await logout(); setMessage('로그아웃되었습니다.') }
    catch (cause) { setMessage(cause instanceof Error ? cause.message : '로그아웃하지 못했습니다.') }
    finally { setBusy(false) }
  }

  return <div className="app-shell"><AppHeader/><main className="account-page"><Link to="/" className="back-link">← 홈으로</Link><section className="account-card">
    {user ? <><h1>계정</h1><p><strong>{user.username}</strong> 계정으로 로그인되어 있습니다.</p><p className="account-note">로그인 상태는 이 브라우저에 유지되며, 일정 시간이 지나면 다시 로그인해야 합니다.</p><button className="button button-outline" onClick={() => void signOut()} disabled={busy}>{busy ? '처리 중…' : '로그아웃'}</button></>
      : <><h1>{mode === 'login' ? '로그인' : '회원가입'}</h1><p>계정에 연결한 제보만 내 제보 화면에 표시됩니다.</p><form onSubmit={(event) => void submit(event)}><label>아이디<input value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" minLength={3} maxLength={50} pattern="[A-Za-z0-9_]+" required/></label><label>비밀번호<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} minLength={mode === 'register' ? 10 : 1} maxLength={72} required/></label><button className="button button-primary" disabled={busy}>{busy ? '처리 중…' : mode === 'login' ? '로그인' : '계정 만들기'}</button></form><button className="account-toggle" type="button" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setMessage('') }}>{mode === 'login' ? '처음 오셨나요? 회원가입' : '이미 계정이 있나요? 로그인'}</button><small className="account-note">비밀번호는 안전하게 보호됩니다. 이전에 익명으로 작성한 제보는 이 기기에서 계속 확인할 수 있습니다.</small></>}
    {message && <p className="account-message" role="status">{message}</p>}
  </section></main></div>
}
