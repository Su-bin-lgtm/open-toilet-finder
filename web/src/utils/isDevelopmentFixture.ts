import type { ToiletSummary } from '../types/toilet'

const DEVELOPMENT_MARKERS = /\b(?:DEVTEST|DEVELOPMENT\s+TEST\s+ONLY)\b|\[DEV(?:ELOPMENT)?(?:\s+TEST)?\]/i

/** Hides explicitly labeled test fixtures in user-facing lists without changing stored/API data. */
export function isDevelopmentFixture(toilet: Pick<ToiletSummary, 'name' | 'address'>) {
  return DEVELOPMENT_MARKERS.test(`${toilet.name} ${toilet.address}`)
}
