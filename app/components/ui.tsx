// Reusable visual building blocks. Pages supply content and behavior; these components
// keep buttons, cards, forms, and dialogs visually consistent.
import { type ButtonHTMLAttributes, type ReactNode, useEffect } from 'react'

export function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md'
}) {
  // Combine common styles with the selected size, color variant, and any page-specific class.
  const base =
    'inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed'
  const sizes = size === 'sm' ? 'px-3 py-1.5 text-sm' : 'px-4 py-2 text-sm'
  const variants: Record<string, string> = {
    primary: 'bg-ink text-paper hover:bg-ink-700',
    secondary: 'bg-white text-ink border border-ink-200 hover:border-ink-400',
    ghost: 'text-ink-600 hover:bg-ink-100',
    danger: 'bg-rust text-white hover:bg-rust-dark',
  }
  return <button className={`${base} ${sizes} ${variants[variant]} ${className}`} {...props} />
}

export function Badge({
  tone = 'neutral',
  children,
}: {
  tone?: 'neutral' | 'stamp' | 'rust' | 'amber'
  children: ReactNode
}) {
  // A semantic name (for example, "stamp") selects the matching Tailwind color set.
  const tones: Record<string, string> = {
    neutral: 'bg-ink-100 text-ink-600',
    stamp: 'bg-stamp-light text-stamp-dark',
    rust: 'bg-rust-light text-rust-dark',
    amber: 'bg-amber-light text-amber',
  }
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${tones[tone]}`}
    >
      {children}
    </span>
  )
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  // A card is simply a bordered white container with the shared shadow.
  return (
    <div className={`rounded-xl border border-ink-100 bg-white shadow-card ${className}`}>
      {children}
    </div>
  )
}

export function Modal({
  open,
  onClose,
  title,
  children,
  width = 'md',
}: {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  width?: 'sm' | 'md' | 'lg'
}) {
  // While open, Escape closes the dialog and background scrolling is disabled.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  // Rendering nothing removes the dialog from the page until it is needed.
  if (!open) return null
  const widths = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl' }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 pt-[8vh] sm:pt-[10vh]">
      {/* This full-screen button is the dimmed backdrop; clicking it closes the dialog. */}
      <button
        aria-label="Close"
        onClick={onClose}
        className="fixed inset-0 bg-ink/40 backdrop-blur-[2px]"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`relative w-full ${widths[width]} rounded-xl border border-ink-100 bg-white p-6 shadow-xl animate-[modalIn_0.15s_ease-out]`}
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-display text-xl text-ink">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="rounded-md p-1 text-ink-400 hover:bg-ink-100 hover:text-ink"
          >
            <CloseIcon />
          </button>
        </div>
        {children}
      </div>
      <style>{`
        @keyframes modalIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  )
}

export function Field({
  label,
  children,
  hint,
}: {
  label: string
  children: ReactNode
  hint?: string
}) {
  // A Field groups a label, input element, and optional help text accessibly.
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-ink-700">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-ink-400">{hint}</span>}
    </label>
  )
}

// Shared class string used by inputs and selects throughout the app.
export const inputClass =
  'w-full rounded-md border border-ink-200 bg-white px-3 py-2 text-sm text-ink placeholder:text-ink-300 focus-visible:border-stamp'

export function EmptyState({
  title,
  body,
  action,
}: {
  title: string
  body: string
  action?: ReactNode
}) {
  // Display a friendly explanation and optional next action when a list has no records.
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-ink-200 px-6 py-16 text-center">
      <p className="font-display text-lg text-ink">{title}</p>
      <p className="mt-1.5 max-w-sm text-sm text-ink-500">{body}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

export function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M4 4l10 10M14 4L4 14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}
