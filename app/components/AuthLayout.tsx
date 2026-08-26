import Link from 'next/link'
import type { ReactNode } from 'react'

export default function AuthLayout({
  eyebrow,
  title,
  children,
  footer,
}: {
  eyebrow: string
  title: string
  children: ReactNode
  footer: ReactNode
}) {
  return (
    <div className="flex min-h-screen bg-paper">
      <div className="hidden w-1/2 flex-col justify-between bg-ink-800 p-10 lg:flex">
        <Link href="/" className="flex items-center gap-2">
          <svg width="24" height="24" viewBox="0 0 32 32">
            <rect width="32" height="32" rx="7" fill="#FAF9F5" fillOpacity="0.06" />
            <g stroke="#FAF9F5" strokeWidth="2.4" strokeLinecap="round">
              <line x1="9" y1="9" x2="9" y2="23" />
              <line x1="14" y1="9" x2="14" y2="23" />
              <line x1="19" y1="9" x2="19" y2="23" />
              <line x1="7" y1="20" x2="22" y2="10" stroke="#1F7A5C" />
            </g>
          </svg>
          <span className="font-display text-xl text-paper">Tally</span>
        </Link>
        <blockquote className="max-w-sm">
          <p className="font-display text-2xl leading-snug text-paper">
            "I stopped losing hours to a spreadsheet I never remembered to open."
          </p>
          <p className="mt-4 text-sm text-ink-400">Every hour, logged where it's earned.</p>
        </blockquote>
        <p className="text-xs text-ink-500">A quiet ledger for freelancers.</p>
      </div>

      <div className="flex w-full flex-col justify-center px-6 py-16 sm:px-16 lg:w-1/2">
        <div className="mx-auto w-full max-w-sm">
          <Link href="/" className="mb-8 flex items-center gap-2 lg:hidden">
            <svg width="22" height="22" viewBox="0 0 32 32">
              <rect width="32" height="32" rx="7" fill="#171C26" />
              <g stroke="#FAF9F5" strokeWidth="2.4" strokeLinecap="round">
                <line x1="9" y1="9" x2="9" y2="23" />
                <line x1="14" y1="9" x2="14" y2="23" />
                <line x1="19" y1="9" x2="19" y2="23" />
                <line x1="7" y1="20" x2="22" y2="10" stroke="#1F7A5C" />
              </g>
            </svg>
            <span className="font-display text-lg text-ink">Tally</span>
          </Link>
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-stamp">{eyebrow}</p>
          <h1 className="mt-2 font-display text-3xl text-ink">{title}</h1>
          <div className="mt-8">{children}</div>
          <p className="mt-6 text-center text-sm text-ink-500">{footer}</p>
        </div>
      </div>
    </div>
  )
}
