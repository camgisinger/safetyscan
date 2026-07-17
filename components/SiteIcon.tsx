interface Props {
  size?: number
  color?: string
  strokeWidth?: number
}

export default function SiteIcon({ size = 24, color = 'currentColor', strokeWidth = 2 }: Props) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 21h6" />
      <path d="M6 21V5" />
      <path d="M2 5h13" />
      <path d="M13 5v3.5" />
      <rect x="13" y="12" width="8" height="9" rx="1" />
      <path d="M13 16.5h8" />
      <path d="M17 12v9" />
    </svg>
  )
}
