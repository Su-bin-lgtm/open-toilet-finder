const DEVICE_ID_KEY = 'open-toilet-finder.device-id'
let fallbackId: string | undefined

function createId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `otf-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

export function getDeviceId(): string {
  if (fallbackId) return fallbackId
  try {
    const stored = localStorage.getItem(DEVICE_ID_KEY)
    if (stored) return stored
    fallbackId = createId()
    localStorage.setItem(DEVICE_ID_KEY, fallbackId)
    return fallbackId
  } catch {
    fallbackId = createId()
    return fallbackId
  }
}
