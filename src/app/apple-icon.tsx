import { ImageResponse } from 'next/og'

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(
    <svg width="180" height="180" viewBox="0 0 32 32">
      <rect width="32" height="32" rx="8" fill="#8bdf63" />
      <path
        d="M16 10.5 L22 21 H10 Z"
        fill="none"
        stroke="rgba(0, 0, 0, 0.5)"
        strokeWidth="0.8"
        strokeLinejoin="round"
      />
      <path d="M16 10.5 L22 21 H10 Z" fill="#ededed" />
    </svg>,
    { ...size },
  )
}
