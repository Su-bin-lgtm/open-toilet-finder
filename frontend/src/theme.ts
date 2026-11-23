// 시안(Figma)의 색을 옮긴 값. 색을 바꿀 때는 이 파일만 고친다.
export const colors = {
  primary: '#2457D6',
  primarySoft: '#EAF0FD',
  text: '#1F2937',
  subText: '#6B7280',
  mutedText: '#9CA3AF',
  border: '#E5E7EB',
  background: '#F3F4F6',
  surface: '#FFFFFF',
  surfaceAlt: '#F8FAFC',
  green: '#0F8A4F',
  greenSoft: '#E6F4EC',
  orange: '#B45309',
  orangeSoft: '#FEF3E2',
  orangeMarker: '#D97706',
  gray: '#6B7280',
  graySoft: '#EEF0F3',
  danger: '#DC2626',
} as const;

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 } as const;
export const radius = { sm: 6, md: 8, lg: 12, pill: 999 } as const;
