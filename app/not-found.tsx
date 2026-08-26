'use client'

import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-paper px-6 text-center">
      <p className="font-mono text-sm text-ink-400">404</p>
      <h1 className="mt-2 font-display text-3xl text-ink">This page didn't get logged.</h1>
      <p className="mt-2 text-ink-500">There's nothing tracked at this address.</p>
      <Link
        href="/"
        className="mt-6 rounded-md bg-ink px-5 py-2.5 text-sm font-medium text-paper hover:bg-ink-700"
      >
        Back home
      </Link>
    </div>
  )
}
