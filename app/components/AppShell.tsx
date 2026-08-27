"use client"

// The app shell is the persistent dashboard frame: navigation, header, and live timer.
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState, type ReactNode } from 'react'
import {
  IconDashboard,
  IconUsers,
  IconFolder,
  IconClock,
  IconInvoice,
  IconSettings,
  IconLogout,
  IconStop,
} from './icons'
import { useData } from '../context/DataContext'
import { useAuth } from '../context/AuthContext'
import { initials } from '../utils/format'

// One source of truth for the sidebar and mobile navigation links.
const NAV = [
  { to: '/app', label: 'Dashboard', icon: IconDashboard, end: true },
  { to: '/app/clients', label: 'Clients', icon: IconUsers },
  { to: '/app/projects', label: 'Projects', icon: IconFolder },
  { to: '/app/time', label: 'Time Entries', icon: IconClock },
  { to: '/app/invoices', label: 'Invoices', icon: IconInvoice },
  { to: '/app/settings', label: 'Settings', icon: IconSettings },
]

function useElapsed(startedAt: number | undefined) {
  // `now` changes every second so React re-renders the displayed elapsed time.
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    if (!startedAt) return
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [startedAt])
  if (!startedAt) return '00:00:00'
  // Convert the difference between now and the timer start into hh:mm:ss parts.
  const secs = Math.max(0, Math.floor((now - startedAt) / 1000))
  const h = String(Math.floor(secs / 3600)).padStart(2, '0')
  const m = String(Math.floor((secs % 3600) / 60)).padStart(2, '0')
  const s = String(secs % 60).padStart(2, '0')
  return `${h}:${m}:${s}`
}

function RunningTimer() {
  // Read the running timer and supporting project/client data from the shared store.
  const { activeTimer, getProject, getClient, stopTimer } = useData()
  const elapsed = useElapsed(activeTimer?.startedAt)
  if (!activeTimer) return null
  const project = getProject(activeTimer.projectId)
  const client = project ? getClient(project.clientId) : undefined

  return (
    <div className="flex items-center gap-3 rounded-full border border-amber/40 bg-amber-light py-1.5 pl-3 pr-1.5">
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber opacity-60" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-amber" />
      </span>
      <span className="text-sm text-ink-700">
        <span className="hidden sm:inline">{project?.name ?? 'Untitled'} · </span>
        <span className="text-ink-400">{client?.name}</span>
      </span>
      <span className="font-mono tabular text-sm font-medium text-ink">{elapsed}</span>
      <button
        // Stopping the timer creates a permanent time entry in DataContext.
        onClick={() => stopTimer()}
        className="flex items-center gap-1 rounded-full bg-ink px-3 py-1 text-xs font-medium text-paper hover:bg-ink-700"
      >
        <IconStop className="h-3 w-3" />
        Stop
      </button>
    </div>
  )
}

export default function AppShell({ children }: { children: ReactNode }) {
  // Next navigation APIs tell us the current URL and let buttons change it.
  const router = useRouter()
  const pathname = usePathname()
  const { signOut, profile } = useAuth()

  return (
    <div className="flex min-h-screen bg-paper-dim">
      {/* Sidebar */}
      <aside className="hidden w-60 shrink-0 flex-col bg-ink-800 px-4 py-6 md:flex">
        <div className="mb-8 flex items-center gap-2 px-2">
          <TallyMark />
          <span className="font-display text-xl tracking-tight text-paper">Tally</span>
        </div>
        <nav className="flex flex-1 flex-col gap-1">
          {/* Create each desktop navigation link from the NAV list. */}
          {NAV.map((item) => (
            <Link
              key={item.to}
              href={item.to}
              // Highlight the link when its URL matches the current page.
              className={
                `flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                  (item.end ? pathname === item.to : pathname.startsWith(item.to))
                    ? 'bg-paper/10 text-paper'
                    : 'text-ink-300 hover:bg-paper/5 hover:text-paper'
                }`
              }
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto border-t border-paper/10 pt-4">
          <div className="flex items-center gap-2 px-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-stamp/20 text-xs font-medium text-stamp">
              {initials(profile.businessName || 'You')}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm text-paper">{profile.businessName || 'Your business'}</p>
              <p className="truncate text-xs text-ink-400">{profile.email}</p>
            </div>
            <button
              onClick={async () => {
                await signOut()
                router.push('/')
              }}
              aria-label="Log out"
              className="rounded-md p-1.5 text-ink-400 hover:bg-paper/10 hover:text-paper"
            >
              <IconLogout className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-40 flex justify-around border-t border-ink-100 bg-white/95 py-2 backdrop-blur md:hidden">
        {/* Small screens use a shortened bottom navigation. */}
        {NAV.slice(0, 5).map((item) => (
          <Link
            key={item.to}
            href={item.to}
            className={
              `flex flex-col items-center gap-0.5 px-2 py-1 text-[10px] ${
                (item.end ? pathname === item.to : pathname.startsWith(item.to)) ? 'text-stamp' : 'text-ink-400'
              }`
            }
          >
            <item.icon className="h-5 w-5" />
            {item.label.split(' ')[0]}
          </Link>
        ))}
      </nav>

      <div className="flex min-w-0 flex-1 flex-col pb-16 md:pb-0">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-ink-100 bg-paper-dim/90 px-4 backdrop-blur sm:px-8">
          <div className="flex items-center gap-2 font-display text-lg text-ink md:hidden">
            <TallyMark dark />
            Tally
          </div>
          <div className="ml-auto flex items-center gap-3">
            <RunningTimer />
            {/* Sidebar (and its logout button) is hidden below md, so give
                tablet / mobile users a way to log out from the header. */}
            <button
              onClick={async () => {
                await signOut()
                router.push('/')
              }}
              aria-label="Log out"
              className="rounded-md p-1.5 text-ink-400 hover:bg-ink-100 hover:text-ink md:hidden"
            >
              <IconLogout className="h-5 w-5" />
            </button>
          </div>
        </header>
        <main className="flex-1 px-4 py-6 sm:px-8 sm:py-8">
          {/* Nested route pages, such as /app/clients, appear here. */}
          {children}
        </main>
      </div>
    </div>
  )
}

function TallyMark({ dark = false }: { dark?: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 32 32" className="shrink-0">
      <rect width="32" height="32" rx="7" fill={dark ? '#171C26' : 'transparent'} />
      <g
        stroke={dark ? '#FAF9F5' : '#FAF9F5'}
        strokeWidth="2.4"
        strokeLinecap="round"
      >
        <line x1="9" y1="9" x2="9" y2="23" />
        <line x1="14" y1="9" x2="14" y2="23" />
        <line x1="19" y1="9" x2="19" y2="23" />
        <line x1="7" y1="20" x2="22" y2="10" stroke="#1F7A5C" />
      </g>
    </svg>
  )
}