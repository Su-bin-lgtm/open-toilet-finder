import { requestData } from './client'

export interface AuthUser { id: number; username: string }
export interface AuthSession { accessToken: string; tokenType: 'Bearer'; expiresAt: string; user: AuthUser }

export function registerAccount(username: string, password: string) {
  return requestData<AuthSession>('/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password }) })
}

export function loginAccount(username: string, password: string) {
  return requestData<AuthSession>('/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password }) })
}

export function logoutAccount() { return requestData<boolean>('/auth/logout', { method: 'POST' }) }
