"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useData } from "../../../context/DataContext";
import { useAuth } from "../../../context/AuthContext";
import { Button, Badge, Card } from "../../../components/ui";
import { IconDownload, IconArrowRight } from "../../../components/icons";
import { formatDate, formatMoney } from "../../../utils/format";

export default function InvoiceDetail() {
  // Read the dynamic [id] part of the URL, then find the matching invoice in shared data.
  const { id } = useParams();
  const { invoices, getClient, markInvoiceStatus } = useData();
  const { profile } = useAuth();
  const invoice = invoices.find((i) => i.id === id);

  if (!invoice) {
    return (
      <div className="mx-auto max-w-2xl py-16 text-center">
        <p className="font-display text-xl text-ink">Invoice not found</p>
        <Link
          href="/app/invoices"
          className="mt-3 inline-block text-sm text-stamp hover:underline"
        >
          Back to invoices
        </Link>
      </div>
    );
  }

  const client = getClient(invoice.clientId);

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link
          href="/app/invoices"
          className="flex items-center gap-1 text-sm text-ink-500 hover:text-ink"
        >
          <span className="rotate-180">
            <IconArrowRight className="h-3.5 w-3.5" />
          </span>
          All invoices
        </Link>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            onClick={() =>
              markInvoiceStatus(
                invoice.id,
                invoice.status === "paid" ? "unpaid" : "paid",
              )
            }
          >
            Mark as {invoice.status === "paid" ? "unpaid" : "paid"}
          </Button>
          <Button onClick={() => window.print()}>
            <IconDownload className="h-4 w-4" />
            Download PDF
          </Button>
        </div>
      </div>

      <Card className="p-8 sm:p-12 print:border-0 print:shadow-none">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div>
            <p className="font-display text-2xl text-ink">
              {profile.businessName || "Your business"}
            </p>
            {profile.ownerName && (
              <p className="text-sm text-ink-500">{profile.ownerName}</p>
            )}
            {profile.email && (
              <p className="text-sm text-ink-500">{profile.email}</p>
            )}
            {profile.address && (
              <p className="whitespace-pre-line text-sm text-ink-500">
                {profile.address}
              </p>
            )}
          </div>
          <div className="text-right">
            <p className="font-mono text-lg text-ink">{invoice.number}</p>
            <Badge tone={invoice.status === "paid" ? "stamp" : "rust"}>
              {invoice.status === "paid" ? "Paid" : "Unpaid"}
            </Badge>
          </div>
        </div>

        <div className="my-8 grid grid-cols-2 gap-6 border-y border-rule py-6 text-sm">
          <div>
            <p className="text-xs uppercase tracking-wide text-ink-400">
              Billed to
            </p>
            <p className="mt-1 font-medium text-ink">{client?.name}</p>
            <p className="text-ink-500">{client?.contactEmail}</p>
          </div>
          <div className="text-right">
            <p className="text-xs uppercase tracking-wide text-ink-400">
              Issue date
            </p>
            <p className="mt-1 text-ink">{formatDate(invoice.issueDate)}</p>
            <p className="mt-2 text-xs uppercase tracking-wide text-ink-400">
              Period
            </p>
            <p className="text-ink-600">
              {formatDate(invoice.rangeStart)} – {formatDate(invoice.rangeEnd)}
            </p>
          </div>
        </div>

        {/* Horizontal scroll region keeps every column reachable on
            tablet / mobile instead of squeezing or clipping the table. */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead>
              <tr className="border-b border-ink-200 text-xs uppercase tracking-wide text-ink-400">
                <th className="py-2 font-medium">Date</th>
                <th className="py-2 font-medium">Project</th>
                <th className="py-2 text-right font-medium">Hours</th>
                <th className="py-2 text-right font-medium">Rate</th>
                <th className="py-2 text-right font-medium">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {invoice.lineItems.map((li) => (
                <tr key={li.entryId} className="border-b border-rule">
                  <td className="py-3 text-ink-500">{formatDate(li.date)}</td>
                  <td className="py-3 text-ink-700">{li.projectName}</td>
                  <td className="py-3 text-right font-mono tabular text-ink-600">
                    {li.hours.toFixed(2)}
                  </td>
                  <td className="py-3 text-right font-mono tabular text-ink-600">
                    {formatMoney(li.rate, invoice.currency)}
                  </td>
                  <td className="py-3 text-right font-mono tabular text-ink">
                    {formatMoney(li.subtotal, invoice.currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 flex justify-end">
          <div className="w-full max-w-[220px]">
            <div className="flex justify-between border-t-2 border-ink pt-3 text-base">
              <span className="font-display text-ink">Total</span>
              <span className="font-mono tabular font-medium text-ink">
                {formatMoney(invoice.total, invoice.currency)}
              </span>
            </div>
          </div>
        </div>
      </Card>

      <p className="mt-4 text-center text-xs text-ink-400 print:hidden">
        “Download PDF” uses your browser's print-to-PDF — wire up server-side
        PDF rendering per backend task 6 for a production-grade export.
      </p>
    </div>
  );
}