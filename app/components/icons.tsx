type IconProps = { className?: string }
const common = { fill: 'none', strokeWidth: 1.6, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }

export function IconDashboard({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" className={className} {...common} stroke="currentColor">
      <rect x="2.5" y="2.5" width="6.5" height="6.5" rx="1.2" />
      <rect x="11" y="2.5" width="6.5" height="4" rx="1.2" />
      <rect x="11" y="8.5" width="6.5" height="9" rx="1.2" />
      <rect x="2.5" y="11" width="6.5" height="6.5" rx="1.2" />
    </svg>
  )
}
export function IconUsers({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" className={className} {...common} stroke="currentColor">
      <circle cx="7" cy="6.5" r="3" />
      <path d="M1.5 17c0-3 2.5-5 5.5-5s5.5 2 5.5 5" />
      <circle cx="14.5" cy="7.5" r="2.3" />
      <path d="M13 12.3c2.6.2 4.5 2 4.5 4.7" />
    </svg>
  )
}
export function IconFolder({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" className={className} {...common} stroke="currentColor">
      <path d="M2.5 5.2c0-.7.6-1.2 1.2-1.2h3.6l1.6 1.8h7.4c.7 0 1.2.6 1.2 1.2v8.3c0 .7-.6 1.2-1.2 1.2H3.7c-.7 0-1.2-.6-1.2-1.2V5.2z" />
    </svg>
  )
}
export function IconClock({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" className={className} {...common} stroke="currentColor">
      <circle cx="10" cy="10" r="7.5" />
      <path d="M10 5.5V10l3 2" />
    </svg>
  )
}
export function IconInvoice({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" className={className} {...common} stroke="currentColor">
      <path d="M5 2.5h7.5L17 7v10a.7.7 0 01-.7.7H5a.7.7 0 01-.7-.7V3.2A.7.7 0 015 2.5z" />
      <path d="M12.5 2.5V7H17" />
      <path d="M6.8 11h6.4M6.8 13.6h6.4M6.8 8.4h3" />
    </svg>
  )
}
export function IconSettings({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" className={className} {...common} stroke="currentColor">
      <circle cx="10" cy="10" r="2.6" />
      <path d="M10 2.8v2M10 15.2v2M17.2 10h-2M4.8 10h-2M15.1 4.9l-1.4 1.4M6.3 13.7l-1.4 1.4M15.1 15.1l-1.4-1.4M6.3 6.3L4.9 4.9" />
    </svg>
  )
}
export function IconPlay({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" className={className} fill="currentColor">
      <path d="M6 4.2c0-.9 1-1.4 1.7-.9l8.4 5.8c.6.4.6 1.3 0 1.7l-8.4 5.8c-.7.5-1.7 0-1.7-.9V4.2z" />
    </svg>
  )
}
export function IconStop({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" className={className} fill="currentColor">
      <rect x="5" y="5" width="10" height="10" rx="1.6" />
    </svg>
  )
}
export function IconPlus({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" className={className} {...common} stroke="currentColor">
      <path d="M10 4v12M4 10h12" />
    </svg>
  )
}
export function IconChevronDown({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" className={className} {...common} stroke="currentColor">
      <path d="M5 7.5l5 5 5-5" />
    </svg>
  )
}
export function IconLogout({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" className={className} {...common} stroke="currentColor">
      <path d="M7.5 17.2H4.3a1 1 0 01-1-1V3.8a1 1 0 011-1h3.2" />
      <path d="M13 14l4-4-4-4M17 10H7.5" />
    </svg>
  )
}
export function IconPencil({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" className={className} {...common} stroke="currentColor">
      <path d="M12.6 3.4l4 4L6.4 17.6l-4.4.8.8-4.4L12.6 3.4z" />
    </svg>
  )
}
export function IconArchive({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" className={className} {...common} stroke="currentColor">
      <rect x="2.5" y="3" width="15" height="3.4" rx="0.8" />
      <path d="M3.8 6.4v9a1 1 0 001 1h10.4a1 1 0 001-1v-9M8 10.5h4" />
    </svg>
  )
}
export function IconTrash({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" className={className} {...common} stroke="currentColor">
      <path d="M3.5 5.5h13M8 5.5V3.8a.8.8 0 01.8-.8h2.4a.8.8 0 01.8.8v1.7M5.5 5.5l.7 10.5a1 1 0 001 1h5.6a1 1 0 001-1l.7-10.5" />
    </svg>
  )
}
export function IconDownload({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" className={className} {...common} stroke="currentColor">
      <path d="M10 2.5v10M6 9l4 4 4-4M3.5 15.5v1.2a1 1 0 001 1h11a1 1 0 001-1v-1.2" />
    </svg>
  )
}
export function IconArrowRight({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" className={className} {...common} stroke="currentColor">
      <path d="M3 10h14M11 4l6 6-6 6" />
    </svg>
  )
}
