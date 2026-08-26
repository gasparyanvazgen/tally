// TypeScript types describe the shape of data. They disappear when the app is built;
// they exist to help you and the editor catch mistakes while writing code.
export type Currency = 'USD' | 'EUR' | 'GBP'

export interface Client {
  // A client is the business or person who receives invoices.
  id: string
  name: string
  contactEmail: string
  defaultRate: number
  currency: Currency
  archived: boolean
  createdAt: string
}

export type ProjectStatus = 'active' | 'completed'

export interface Project {
  // Every project belongs to one client through clientId.
  id: string
  clientId: string
  name: string
  status: ProjectStatus
  rateOverride: number | null
  createdAt: string
}

export interface TimeEntry {
  // A time entry records completed work. invoiceId stays null until it has been billed.
  id: string
  projectId: string
  date: string // ISO date, yyyy-mm-dd
  minutes: number
  note: string
  billed: boolean
  invoiceId: string | null
  createdAt: string
}

export type InvoiceStatus = 'unpaid' | 'paid'

export interface InvoiceLineItem {
  // Invoice lines copy the relevant time-entry details so the invoice remains historically accurate.
  entryId: string
  date: string
  projectName: string
  hours: number
  rate: number
  subtotal: number
}

export interface Invoice {
  // An invoice groups billed work for one client and stores its financial snapshot.
  id: string
  number: string
  clientId: string
  issueDate: string
  rangeStart: string
  rangeEnd: string
  lineItems: InvoiceLineItem[]
  total: number
  currency: Currency
  status: InvoiceStatus
  createdAt: string
}

export interface BusinessProfile {
  // These details are shown on invoices and edited on the Settings page.
  businessName: string
  ownerName: string
  email: string
  address: string
}
