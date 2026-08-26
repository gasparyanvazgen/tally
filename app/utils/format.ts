// Pure helper functions: they transform values without reading or changing React state.
import type { Currency } from '../types'

export function uid(prefix = ''): string {
  // Make a lightweight demo identifier. A production database should generate secure IDs.
  const rand = Math.random().toString(36).slice(2, 9)
  return prefix ? `${prefix}_${rand}` : rand
}

// Map every supported currency code to the symbol shown before amounts.
const CURRENCY_SYMBOL: Record<Currency, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
}

export function formatMoney(amount: number, currency: Currency = 'USD'): string {
  // Convert a number into an invoice-friendly string with two decimal places.
  const symbol = CURRENCY_SYMBOL[currency]
  return `${symbol}${amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

export function minutesToHM(minutes: number): string {
  // Convert stored minutes into a short human-readable duration, such as "1h 30m".
  const h = Math.floor(minutes / 60)
  const m = Math.round(minutes % 60)
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

export function minutesToHours(minutes: number): number {
  // Invoice line items use decimal hours, rounded to two decimal places.
  return Math.round((minutes / 60) * 100) / 100
}

export function formatDate(iso: string): string {
  // Add a local midnight time so a yyyy-mm-dd string is not shifted by timezone parsing.
  const d = new Date(iso + 'T00:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function todayISO(): string {
  // Return today's date in the same yyyy-mm-dd format used by form inputs and records.
  return new Date().toISOString().slice(0, 10)
}

export function initials(name: string): string {
  // Keep the first letter from up to two words for an avatar-style label.
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('')
}

export function isWithinRange(date: string, start: string, end: string): boolean {
  // ISO dates sort alphabetically in chronological order, so string comparison is safe here.
  return date >= start && date <= end
}

export function startOfWeekISO(from = new Date()): string {
  // Move a copied Date back to Monday; the original Date supplied by the caller is unchanged.
  const d = new Date(from)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  const monday = new Date(d.setDate(diff))
  return monday.toISOString().slice(0, 10)
}

export function startOfMonthISO(from = new Date()): string {
  // Build the first day of the month with leading zeroes where necessary.
  return `${from.getFullYear()}-${String(from.getMonth() + 1).padStart(2, '0')}-01`
}
