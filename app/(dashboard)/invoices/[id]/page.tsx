"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Pencil,
  Download,
  Send,
  CheckCircle,
  FileText,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Skeleton } from "@/components/ui/skeleton";
import { useInvoice, useUpdateInvoiceStatus } from "@/hooks/useInvoices";
import { formatCurrency, formatDate } from "@/lib/utils";

const statusColors: Record<string, "gray" | "blue" | "green" | "red" | "purple" | "amber"> = {
  DRAFT: "gray",
  SENT: "blue",
  VIEWED: "purple",
  PAID: "green",
  OVERDUE: "red",
  CANCELLED: "gray",
};

export default function InvoiceDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [sendModal, setSendModal] = useState(false);
  const [sending, setSending] = useState(false);
  const [personalMessage, setPersonalMessage] = useState("");
  const { data: invoice, isLoading, refetch } = useInvoice(params.id);
  const updateStatus = useUpdateInvoiceStatus();

  const handleGeneratePdf = async () => {
    setGeneratingPdf(true);
    try {
      const res = await fetch(`/api/invoices/${params.id}/pdf`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("PDF generation failed");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
      await refetch();
      toast.success("PDF generated successfully");
    } catch {
      toast.error("Failed to generate PDF");
    } finally {
      setGeneratingPdf(false);
    }
  };

  const handleSendEmail = async () => {
    setSending(true);
    try {
      const res = await fetch(`/api/invoices/${params.id}/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ personalMessage: personalMessage || undefined }),
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || "Failed to send");
      }
      await refetch();
      setSendModal(false);
      setPersonalMessage("");
      toast.success("Invoice sent to client!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send email");
    } finally {
      setSending(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <FileText className="h-12 w-12 text-gray-300" />
        <p className="mt-4 text-gray-500">Invoice not found</p>
        <Button variant="ghost" className="mt-4" onClick={() => router.push("/invoices")}>
          Back to Invoices
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-4">
        <Link href="/invoices">
          <button className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800">
            <ArrowLeft className="h-5 w-5" />
          </button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="font-mono text-2xl font-bold text-gray-900 dark:text-white">
              {invoice.invoiceNumber}
            </h1>
            <Badge variant={statusColors[invoice.status] ?? "gray"}>
              {invoice.status}
            </Badge>
            {invoice.aiGenerated && (
              <Badge variant="amber">AI Generated</Badge>
            )}
          </div>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            For {invoice.client.name}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {invoice.status !== "PAID" && (
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                updateStatus.mutate({ id: invoice.id, status: "PAID" })
              }
            >
              <CheckCircle className="h-4 w-4" />
              Mark Paid
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={handleGeneratePdf}
            disabled={generatingPdf}
          >
            {generatingPdf ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            {generatingPdf ? "Generating..." : "Generate PDF"}
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={!invoice.pdfUrl}
            onClick={() => setSendModal(true)}
          >
            <Send className="h-4 w-4" />
            Send
          </Button>
          <Link href={`/invoices/${invoice.id}/edit`}>
            <Button size="sm">
              <Pencil className="h-4 w-4" />
              Edit
            </Button>
          </Link>
        </div>
      </div>

      {/* Invoice Preview */}
      <Card className="mx-auto max-w-3xl">
        {/* Header section */}
        <div className="flex justify-between border-b border-gray-200 pb-6 dark:border-slate-700">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {invoice.user?.businessName ?? invoice.user?.name ?? ""}
            </h2>
            {invoice.user?.address && (
              <p className="mt-1 text-sm text-gray-500">{invoice.user.address}</p>
            )}
            {invoice.user?.phone && (
              <p className="text-sm text-gray-500">{invoice.user.phone}</p>
            )}
            {invoice.user?.taxNumber && (
              <p className="text-sm text-gray-500">
                Tax #: {invoice.user.taxNumber}
              </p>
            )}
          </div>
          <div className="text-right">
            <p className="font-mono text-2xl font-bold text-primary">INVOICE</p>
            <p className="mt-1 font-mono text-sm text-gray-500">
              {invoice.invoiceNumber}
            </p>
          </div>
        </div>

        {/* Bill to + dates */}
        <div className="mt-6 grid grid-cols-2 gap-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
              Bill To
            </p>
            <p className="mt-1 font-medium text-gray-900 dark:text-white">
              {invoice.client.name}
            </p>
            <p className="text-sm text-gray-500">{invoice.client.email}</p>
          </div>
          <div className="text-right">
            <div className="space-y-1">
              <p className="text-sm">
                <span className="text-gray-400">Issue Date: </span>
                <span className="text-gray-700 dark:text-gray-300">
                  {formatDate(invoice.issueDate)}
                </span>
              </p>
              <p className="text-sm">
                <span className="text-gray-400">Due Date: </span>
                <span className="text-gray-700 dark:text-gray-300">
                  {formatDate(invoice.dueDate)}
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Line items table */}
        <div className="mt-6 overflow-x-auto rounded-lg border border-gray-200 dark:border-slate-700">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 dark:bg-slate-800/50">
              <tr>
                <th className="px-4 py-2 font-medium text-gray-500">Description</th>
                <th className="px-4 py-2 text-right font-medium text-gray-500">Qty</th>
                <th className="px-4 py-2 text-right font-medium text-gray-500">
                  Unit Price
                </th>
                <th className="px-4 py-2 text-right font-medium text-gray-500">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-700/50">
              {invoice.lineItems.map((item, i) => (
                <tr
                  key={item.id ?? i}
                  className={i % 2 === 1 ? "bg-gray-50/50 dark:bg-slate-800/20" : ""}
                >
                  <td className="px-4 py-3 text-gray-900 dark:text-gray-100">
                    {item.description}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-gray-700 dark:text-gray-300">
                    {item.quantity}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-gray-700 dark:text-gray-300">
                    {formatCurrency(item.unitPrice)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-medium text-gray-900 dark:text-gray-100">
                    {formatCurrency(item.total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="mt-4 flex justify-end">
          <div className="w-64 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Subtotal</span>
              <span className="font-mono text-gray-900 dark:text-white">
                {formatCurrency(invoice.subtotal)}
              </span>
            </div>
            {invoice.discountAmount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">
                  Discount
                  {invoice.discountType === "percentage"
                    ? ` (${invoice.discountValue}%)`
                    : ""}
                </span>
                <span className="font-mono text-danger">
                  -{formatCurrency(invoice.discountAmount)}
                </span>
              </div>
            )}
            {invoice.taxAmount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">
                  Tax ({invoice.taxRate}%)
                </span>
                <span className="font-mono text-gray-900 dark:text-white">
                  {formatCurrency(invoice.taxAmount)}
                </span>
              </div>
            )}
            <div className="flex justify-between border-t border-gray-200 pt-2 dark:border-slate-700">
              <span className="text-lg font-semibold text-gray-900 dark:text-white">
                Total
              </span>
              <span className="font-mono text-lg font-bold text-gray-900 dark:text-white">
                {formatCurrency(invoice.total)}
              </span>
            </div>
          </div>
        </div>

        {/* Notes */}
        {invoice.notes && (
          <div className="mt-6 border-t border-gray-200 pt-4 dark:border-slate-700">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
              Notes
            </p>
            <p className="mt-1 whitespace-pre-line text-sm text-gray-600 dark:text-gray-400">
              {invoice.notes}
            </p>
          </div>
        )}
      </Card>

      {/* Send Email Modal */}
      <Modal
        open={sendModal}
        onClose={() => setSendModal(false)}
        title="Send Invoice to Client"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              To
            </label>
            <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
              {invoice.client.email}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Invoice
            </label>
            <p className="mt-1 font-mono text-sm text-gray-900 dark:text-gray-100">
              {invoice.invoiceNumber} &mdash; {formatCurrency(invoice.total)}
            </p>
          </div>
          <div className="space-y-1">
            <label
              htmlFor="personalMessage"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Personal Message (optional)
            </label>
            <textarea
              id="personalMessage"
              rows={3}
              value={personalMessage}
              onChange={(e) => setPersonalMessage(e.target.value)}
              placeholder="Add a personal note to the email..."
              className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-gray-600 dark:bg-slate-800 dark:text-gray-100 dark:placeholder-gray-500"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="secondary"
              onClick={() => setSendModal(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleSendEmail} loading={sending}>
              <Send className="h-4 w-4" />
              Send Invoice
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
