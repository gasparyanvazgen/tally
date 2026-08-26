import type { Client, Project, TimeEntry, Invoice } from '../types'
import { uid, todayISO } from './format'

function daysAgo(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().slice(0, 10)
}

export function seedClients(): Client[] {
  return [
    {
      id: 'client_acme',
      name: 'Acme Robotics',
      contactEmail: 'billing@acmerobotics.io',
      defaultRate: 150,
      currency: 'USD',
      archived: false,
      createdAt: daysAgo(120),
    },
    {
      id: 'client_northwind',
      name: 'Northwind Studio',
      contactEmail: 'hello@northwindstudio.com',
      defaultRate: 120,
      currency: 'USD',
      archived: false,
      createdAt: daysAgo(95),
    },
    {
      id: 'client_solathan',
      name: 'Solathan & Rey',
      contactEmail: 'accounts@solathanrey.eu',
      defaultRate: 110,
      currency: 'EUR',
      archived: false,
      createdAt: daysAgo(60),
    },
    {
      id: 'client_shrongh',
      name: 'Shrongh Analytics',
      contactEmail: 'finance@shrongh.com',
      defaultRate: 165,
      currency: 'USD',
      archived: true,
      createdAt: daysAgo(200),
    },
  ]
}

export function seedProjects(): Project[] {
  return [
    {
      id: 'proj_website',
      clientId: 'client_acme',
      name: 'Website Redesign',
      status: 'active',
      rateOverride: null,
      createdAt: daysAgo(90),
    },
    {
      id: 'proj_mobile',
      clientId: 'client_acme',
      name: 'Mobile App — Onboarding Flow',
      status: 'completed',
      rateOverride: 175,
      createdAt: daysAgo(88),
    },
    {
      id: 'proj_brand',
      clientId: 'client_northwind',
      name: 'Brand & Marketing Site',
      status: 'active',
      rateOverride: null,
      createdAt: daysAgo(70),
    },
    {
      id: 'proj_content',
      clientId: 'client_northwind',
      name: 'Social Media Content System',
      status: 'active',
      rateOverride: 95,
      createdAt: daysAgo(40),
    },
    {
      id: 'proj_consult',
      clientId: 'client_solathan',
      name: 'Quarterly Consultancy Retainer',
      status: 'active',
      rateOverride: null,
      createdAt: daysAgo(55),
    },
  ]
}

export function seedTimeEntries(): TimeEntry[] {
  const notes = [
    'Client call',
    'Bug fixes',
    'Design review',
    'Component build-out',
    'Copy pass',
    'Sprint planning',
    'QA + polish',
    '',
  ]
  const entries: TimeEntry[] = []
  const projects = ['proj_website', 'proj_mobile', 'proj_brand', 'proj_content', 'proj_consult']
  let seed = 7
  const rand = () => {
    seed = (seed * 16807) % 2147483647
    return seed / 2147483647
  }
  for (let i = 0; i < 26; i++) {
    const day = daysAgo(Math.floor(rand() * 34))
    entries.push({
      id: uid('entry'),
      projectId: projects[Math.floor(rand() * projects.length)],
      date: day,
      minutes: Math.round((30 + rand() * 300) / 5) * 5,
      note: notes[Math.floor(rand() * notes.length)],
      billed: i % 5 === 0,
      invoiceId: i % 5 === 0 ? 'inv_1001' : null,
      createdAt: day,
    })
  }
  return entries.sort((a, b) => (a.date < b.date ? 1 : -1))
}

export function seedInvoices(): Invoice[] {
  return [
    {
      id: 'inv_1001',
      number: 'TAL-1001',
      clientId: 'client_acme',
      issueDate: daysAgo(30),
      rangeStart: daysAgo(45),
      rangeEnd: daysAgo(31),
      lineItems: [
        {
          entryId: 'seed-1',
          date: daysAgo(40),
          projectName: 'Website Redesign',
          hours: 6,
          rate: 150,
          subtotal: 900,
        },
        {
          entryId: 'seed-2',
          date: daysAgo(35),
          projectName: 'Mobile App — Onboarding Flow',
          hours: 4.5,
          rate: 175,
          subtotal: 787.5,
        },
      ],
      total: 1687.5,
      currency: 'USD',
      status: 'paid',
      createdAt: daysAgo(30),
    },
    {
      id: 'inv_1002',
      number: 'TAL-1002',
      clientId: 'client_northwind',
      issueDate: daysAgo(12),
      rangeStart: daysAgo(28),
      rangeEnd: daysAgo(13),
      lineItems: [
        {
          entryId: 'seed-3',
          date: daysAgo(20),
          projectName: 'Brand & Marketing Site',
          hours: 8,
          rate: 120,
          subtotal: 960,
        },
      ],
      total: 960,
      currency: 'USD',
      status: 'unpaid',
      createdAt: daysAgo(12),
    },
  ]
}

export const today = todayISO
