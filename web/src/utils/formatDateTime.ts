export function formatDateTime(value: string | null): string {
  if (!value) return '시간 정보 없음'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '시간 정보 없음'

  return date.toLocaleString('ko-KR', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
