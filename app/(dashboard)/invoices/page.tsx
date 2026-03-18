"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Plus,
  FileText,
  Search,
  Trash2,
  Eye,
  Pencil,
  Download,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useInvoices,
  useDeleteInvoice,
  useUpdateInvoiceStatus,
} from "@/hooks/useInvoices";
import { formatCurrency, formatDate } from "@/lib/utils";

const statusFilters = ["ALL", "DRAFT", "SENT", "PAID", "OVERDUE", "CANCELLED"];

const statusColors: Record<string, "gray" | "blue" | "green" | "red" | "purple" | "amber"> = {
  DRAFT: "gray",
  SENT: "blue",
  VIEWED: "purple",
  PAID: "green",
  OVERDUE: "red",
  CANCELLED: "gray",
};

export default function InvoicesPage() {
  const [status, setStatus] = useState("ALL");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  const { data, isLoading } = useInvoices(status, page);
  const deleteInvoice = useDeleteInvoice();
  const updateStatus = useUpdateInvoiceStatus();

  const invoices = data?.data;
  const pagination = data?.pagination;

  const filtered = invoices?.filter(
    (inv) =>
      inv.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
      inv.client.name.toLowerCase().includes(search.toLowerCase())
  );

  const getDaysInfo = (dueDate: string, invoiceStatus: string) => {
    if (invoiceStatus === "PAID" || invoiceStatus === "CANCELLED") return null;
    const days = Math.ceil(
      (new Date(dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    if (days < 0) return { text: `${Math.abs(days)}d overdue`, color: "text-danger" };
    if (days === 0) return { text: "Due today", color: "text-warning" };
    return { text: `${days}d left`, color: "text-gray-500" };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Invoices
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Manage and track your invoices
          </p>
        </div>
        <Link href="/invoices/new">
          <Button>
            <Plus className="h-4 w-4" />
            New Invoice
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by invoice # or client..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="block w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-3 text-sm text-gray-900 placeholder-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-gray-600 dark:bg-slate-800 dark:text-gray-100 dark:placeholder-gray-500"
          />
        </div>
        <div className="flex gap-1 overflow-x-auto">
          {statusFilters.map((s) => (
            <button
              key={s}
              onClick={() => {
                setStatus(s);
                setPage(1);
              }}
              className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                status === s
                  ? "bg-primary text-white"
                  : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-slate-800"
              }`}
            >
              {s === "ALL" ? "All" : s.charAt(0) + s.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <Card>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-4 w-32 flex-1" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Empty state */}
      {!isLoading && (!invoices || invoices.length === 0) && (
        <Card className="flex flex-col items-center justify-center py-12">
          <FileText className="h-12 w-12 text-gray-300 dark:text-gray-600" />
          <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
            No invoices yet
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Create your first invoice to get started
          </p>
          <Link href="/invoices/new">
            <Button className="mt-4">
              <Plus className="h-4 w-4" />
              Create Invoice
            </Button>
          </Link>
        </Card>
      )}

      {/* Invoice table */}
      {!isLoading && filtered && filtered.length > 0 && (
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-200 bg-gray-50 dark:border-slate-700 dark:bg-slate-800/50">
                <tr>
                  <th className="px-6 py-3 font-medium text-gray-500 dark:text-gray-400">
                    Invoice
                  </th>
                  <th className="px-6 py-3 font-medium text-gray-500 dark:text-gray-400">
                    Client
                  </th>
                  <th className="px-6 py-3 font-medium text-gray-500 dark:text-gray-400">
                    Amount
                  </th>
                  <th className="px-6 py-3 font-medium text-gray-500 dark:text-gray-400">
                    Status
                  </th>
                  <th className="px-6 py-3 font-medium text-gray-500 dark:text-gray-400">
                    Due Date
                  </th>
                  <th className="px-6 py-3 font-medium text-gray-500 dark:text-gray-400">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                {filtered.map((invoice) => {
                  const daysInfo = getDaysInfo(invoice.dueDate, invoice.status);
                  return (
                    <tr
                      key={invoice.id}
                      className="hover:bg-gray-50 dark:hover:bg-slate-800/50"
                    >
                      <td className="px-6 py-4">
                        <span className="font-mono font-medium text-gray-900 dark:text-white">
                          {invoice.invoiceNumber}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                        {invoice.client.name}
                      </td>
                      <td className="px-6 py-4 font-mono font-medium text-gray-900 dark:text-white">
                        {formatCurrency(invoice.total)}
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={statusColors[invoice.status] ?? "gray"}>
                          {invoice.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-gray-600 dark:text-gray-400">
                          {formatDate(invoice.dueDate)}
                        </span>
                        {daysInfo && (
                          <p className={`text-xs ${daysInfo.color}`}>
                            {daysInfo.text}
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1">
                          <Link href={`/invoices/${invoice.id}`}>
                            <button className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-slate-700">
                              <Eye className="h-4 w-4" />
                            </button>
                          </Link>
                          <Link href={`/invoices/${invoice.id}/edit`}>
                            <button className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-slate-700">
                              <Pencil className="h-4 w-4" />
                            </button>
                          </Link>
                          {invoice.pdfUrl && (
                            <a
                              href={invoice.pdfUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <button className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-slate-700">
                                <Download className="h-4 w-4" />
                              </button>
                            </a>
                          )}
                          {invoice.status !== "PAID" && (
                            <button
                              onClick={() =>
                                updateStatus.mutate({
                                  id: invoice.id,
                                  status: "PAID",
                                })
                              }
                              className="rounded p-1 text-gray-400 hover:bg-green-50 hover:text-success dark:hover:bg-green-900/20"
                              title="Mark as Paid"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            onClick={() => {
                              if (confirm("Delete this invoice?")) {
                                deleteInvoice.mutate(invoice.id);
                              }
                            }}
                            className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-danger dark:hover:bg-red-900/20"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-gray-200 px-6 py-3 dark:border-slate-700">
              <p className="text-sm text-gray-500">
                Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                >
                  Previous
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page >= pagination.totalPages}
                  onClick={() => setPage(page + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
