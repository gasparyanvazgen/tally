"use client";

import Link from "next/link";
import EarningsMeter from "./components/EarningsMeter";
import {
  IconArrowRight,
  IconClock,
  IconInvoice,
  IconUsers,
  IconDashboard,
  IconFolder,
} from "./components/icons";

const FEATURES = [
  {
    icon: IconUsers,
    title: "Clients",
    body: "Every client in one place, with a default rate and currency, so you never have to remember whose invoice looks different.",
  },
  {
    icon: IconFolder,
    title: "Projects",
    body: "Group work by project, override a client\u2019s rate when a project is billed differently, and mark it done when it\u2019s done.",
  },
  {
    icon: IconClock,
    title: "Time tracking",
    body: "Start a timer while you work, or log a session after the fact. Edit or delete an entry any time you catch a mistake.",
  },
  {
    icon: IconDashboard,
    title: "Dashboard",
    body: "Hours this week, earnings this month by client, and a quick chart of the last few weeks — built for a glance, not a report.",
  },
  {
    icon: IconInvoice,
    title: "Invoicing",
    body: "Pick a client and a date range, and Tally pulls in the unbilled hours. Download a clean PDF, then track it until it\u2019s paid.",
  },
];

const STEPS = [
  {
    n: "01",
    title: "Log the hour",
    body: "Start the timer when you sit down, or add a session later. Nothing is billable until you\u2019ve told Tally about it.",
  },
  {
    n: "02",
    title: "Watch it add up",
    body: "Your dashboard keeps a running total by client, so you know where the month stands before you go looking for it.",
  },
  {
    n: "03",
    title: "Send the invoice",
    body: "Pick a client and a range, and every unbilled hour becomes one clean PDF — marked billed the moment it\u2019s sent.",
  },
];

export default function Landing() {
  // The public home page: it introduces the product and links visitors into sign-up or login.
  return (
    <div className="bg-paper">
      <SiteHeader />

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 pb-20 pt-14 sm:pt-20">
        <div className="grid items-center gap-14 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-ink-200 px-3 py-1 text-xs text-ink-500">
              Built for one freelancer juggling several clients
            </p>
            <h1 className="font-display text-[2.6rem] leading-[1.08] tracking-tight text-ink sm:text-6xl">
              Every billable hour,{" "}
              <em className="italic text-stamp">accounted for.</em>
            </h1>
            <p className="mt-5 max-w-lg text-lg text-ink-500">
              Tally is a quiet ledger for freelancers: log time against real
              clients, watch what you're earning as you go, and turn unbilled
              hours into a PDF invoice in a couple of clicks.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 rounded-md bg-ink px-5 py-3 text-sm font-medium text-paper hover:bg-ink-700"
              >
                Start tracking, free
                <IconArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-md border border-ink-200 px-5 py-3 text-sm font-medium text-ink hover:border-ink-400"
              >
                Log in
              </Link>
            </div>
            <p className="mt-5 text-xs text-ink-400">
              No card required. Your data stays yours — export it any time.
            </p>
          </div>

          <div className="flex justify-center lg:justify-end">
            <EarningsMeter />
          </div>
        </div>
      </section>

      {/* The problem, named plainly */}
      <section className="border-y border-rule bg-paper-dim">
        <div className="mx-auto max-w-6xl px-6 py-14">
          <div className="grid gap-10 sm:grid-cols-3">
            <Stat
              n="2"
              label="missed billable sessions is two too many — that's what started this"
            />
            <Stat n="½ day" label="lost to invoicing by hand, most months" />
            <Stat
              n="1"
              label="place to see it all: hours, earnings, and who still owes you"
            />
          </div>
        </div>
      </section>

      {/* How it works — a real sequence, so numbering earns its keep */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <h2 className="font-display text-3xl text-ink sm:text-4xl">
          How an hour becomes an invoice
        </h2>
        <div className="mt-10 grid gap-8 sm:grid-cols-3">
          {STEPS.map((s) => (
            <div key={s.n} className="border-t border-rule pt-5">
              <span className="font-mono text-sm text-stamp">{s.n}</span>
              <h3 className="mt-2 font-display text-xl text-ink">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-500">
                {s.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Feature grid */}
      <section className="bg-ink-800 py-20">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="font-display text-3xl text-paper sm:text-4xl">
            Everything the job needs. Nothing it doesn't.
          </h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="rounded-xl border border-paper/10 bg-paper/[0.03] p-6"
              >
                <f.icon className="h-5 w-5 text-stamp" />
                <h3 className="mt-4 font-display text-lg text-paper">
                  {f.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-300">
                  {f.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-6 py-24 text-center">
        <h2 className="font-display text-3xl text-ink sm:text-4xl">
          Go from no invoice to sent invoice in under two minutes.
        </h2>
        <p className="mx-auto mt-4 max-w-md text-ink-500">
          Set up your first client and start your first timer today — it's free
          while you try it.
        </p>
        <Link
          href="/signup"
          className="mt-8 inline-flex items-center gap-2 rounded-md bg-ink px-6 py-3 text-sm font-medium text-paper hover:bg-ink-700"
        >
          Create your account
          <IconArrowRight className="h-4 w-4" />
        </Link>
      </section>

      <SiteFooter />
    </div>
  );
}

function Stat({ n, label }: { n: string; label: string }) {
  // Reusable small statistic used by the landing page's social-proof section.
  return (
    <div>
      <p className="font-mono text-4xl text-ink">{n}</p>
      <p className="mt-2 text-sm leading-relaxed text-ink-500">{label}</p>
    </div>
  );
}

function SiteHeader() {
  // The public navigation is separate from AppShell because visitors are not logged in yet.
  return (
    <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
      <div className="flex items-center gap-2">
        <svg width="24" height="24" viewBox="0 0 32 32">
          <rect width="32" height="32" rx="7" fill="#171C26" />
          <g stroke="#FAF9F5" strokeWidth="2.4" strokeLinecap="round">
            <line x1="9" y1="9" x2="9" y2="23" />
            <line x1="14" y1="9" x2="14" y2="23" />
            <line x1="19" y1="9" x2="19" y2="23" />
            <line x1="7" y1="20" x2="22" y2="10" stroke="#1F7A5C" />
          </g>
        </svg>
        <span className="font-display text-xl tracking-tight text-ink">
          Tally
        </span>
      </div>
      <nav className="flex items-center gap-6">
        <Link
          href="/login"
          className="text-sm font-medium text-ink-600 hover:text-ink"
        >
          Log in
        </Link>
        <Link
          href="/signup"
          className="rounded-md bg-ink px-4 py-2 text-sm font-medium text-paper hover:bg-ink-700"
        >
          Get started
        </Link>
      </nav>
    </header>
  );
}

function SiteFooter() {
  // The footer repeats public navigation links at the bottom of the landing page.
  return (
    <footer className="border-t border-rule">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-8 text-sm text-ink-400 sm:flex-row">
        <p>
          &copy; {new Date().getFullYear()} Tally. Built for a practice of one.
        </p>
        <div className="flex gap-6">
          <Link href="/login" className="hover:text-ink">
            Log in
          </Link>
          <Link href="/signup" className="hover:text-ink">
            Sign up
          </Link>
        </div>
      </div>
    </footer>
  );
}
