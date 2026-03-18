"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatDate } from "@/lib/utils";

type PublicInvoice = {
  id: string;
  invoiceNumber: string;
  status: string;
  issueDate: string;
  dueDate: string;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  discountType: string | null;
  discountValue: number;
  discountAmount: number;
  total: number;
  notes: string | null;
  pdfUrl: string | null;
  client: { name: string; email: string };
  user: {
    name: string;
    businessName: string | null;
    businessLogo: string | null;
    address: string | null;
    phone: string | null;
    taxNumber: string | null;
    currency: string;
  };
  lineItems: Array<{
    id: string;
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
};

const statusColors: Record<string, "gray" | "blue" | "green" | "red" | "purple" | "amber"> = {
  DRAFT: "gray",
  SENT: "blue",
  VIEWED: "purple",
  PAID: "green",
  OVERDUE: "red",
  CANCELLED: "gray",
};

export default function PublicInvoicePage({ params }: { params: { token: string } }) {
  const [invoice, setInvoice] = useState<PublicInvoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadInvoice() {
      try {
        const res = await fetch(`/api/public/invoices/${params.token}`);
        const json = await res.json();

        if (!res.ok) {
          throw new Error(json.error || "Failed to load invoice");
        }

        if (isMounted) setInvoice(json.data);
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : "Failed to load invoice");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadInvoice();

    return () => {
      isMounted = false;
    };
  }, [params.token]);

  const markPaid = async () => {
    setPaying(true);
    try {
      const res = await fetch(`/api/public/invoices/${params.token}/pay`, {
        method: "POST",
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Failed to mark paid");
      }

      setInvoice((prev) => (prev ? { ...prev, status: "PAID" } : prev));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to mark paid");
    } finally {
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl space-y-4 p-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="mx-auto max-w-2xl p-6 text-center">
        <h1 className="text-2xl font-bold text-gray-900">Invoice unavailable</h1>
        <p className="mt-2 text-sm text-gray-500">{error || "This invoice link is invalid or expired."}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <Card>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-mono text-2xl font-bold text-gray-900">{invoice.invoiceNumber}</h1>
            <p className="text-sm text-gray-500">Issued by {invoice.user.businessName || invoice.user.name}</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={statusColors[invoice.status] ?? "gray"}>{invoice.status}</Badge>
            {invoice.pdfUrl ? (
              <a href={invoice.pdfUrl} target="_blank" rel="noreferrer">
                <Button variant="outline">Download PDF</Button>
              </a>
            ) : null}
            {invoice.status !== "PAID" && invoice.status !== "CANCELLED" ? (
              <Button onClick={markPaid} loading={paying}>Mark as Paid</Button>
            ) : null}
          </div>
        </div>
      </Card>

      {error ? <p className="text-sm text-danger">{error}</p> : null}

      <Card>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <p className="text-xs uppercase tracking-wider text-gray-400">Bill To</p>
            <p className="mt-1 text-sm font-medium text-gray-900">{invoice.client.name}</p>
            <p className="text-sm text-gray-500">{invoice.client.email}</p>
          </div>
          <div className="text-left sm:text-right">
            <p className="text-sm text-gray-500">Issue: {formatDate(invoice.issueDate)}</p>
            <p className="text-sm text-gray-500">Due: {formatDate(invoice.dueDate)}</p>
          </div>
        </div>

        <div className="mt-6 overflow-x-auto rounded-lg border border-gray-200">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2">Description</th>
                <th className="px-4 py-2 text-right">Qty</th>
                <th className="px-4 py-2 text-right">Unit</th>
                <th className="px-4 py-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {invoice.lineItems.map((item) => (
                <tr key={item.id} className="border-t border-gray-100">
                  <td className="px-4 py-2">{item.description}</td>
                  <td className="px-4 py-2 text-right">{item.quantity}</td>
                  <td className="px-4 py-2 text-right">{formatCurrency(item.unitPrice, invoice.user.currency)}</td>
                  <td className="px-4 py-2 text-right font-medium">{formatCurrency(item.total, invoice.user.currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 ml-auto max-w-xs space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Subtotal</span>
            <span>{formatCurrency(invoice.subtotal, invoice.user.currency)}</span>
          </div>
          {invoice.discountAmount > 0 ? (
            <div className="flex justify-between">
              <span className="text-gray-500">Discount</span>
              <span className="text-danger">-{formatCurrency(invoice.discountAmount, invoice.user.currency)}</span>
            </div>
          ) : null}
          {invoice.taxAmount > 0 ? (
            <div className="flex justify-between">
              <span className="text-gray-500">Tax ({invoice.taxRate}%)</span>
              <span>{formatCurrency(invoice.taxAmount, invoice.user.currency)}</span>
            </div>
          ) : null}
          <div className="flex justify-between border-t border-gray-200 pt-2 text-base font-semibold">
            <span>Total</span>
            <span>{formatCurrency(invoice.total, invoice.user.currency)}</span>
          </div>
        </div>

        {invoice.notes ? (
          <div className="mt-6 border-t border-gray-200 pt-4">
            <p className="text-xs uppercase tracking-wider text-gray-400">Notes</p>
            <p className="mt-1 whitespace-pre-line text-sm text-gray-600">{invoice.notes}</p>
          </div>
        ) : null}
      </Card>
    </div>
  );
}
