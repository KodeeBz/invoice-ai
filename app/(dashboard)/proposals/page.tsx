"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, FileText, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useProposals } from "@/hooks/useProposals";
import { formatCurrency, formatDate } from "@/lib/utils";

const statusColors: Record<string, "gray" | "blue" | "green" | "red" | "purple" | "amber"> = {
  DRAFT: "gray",
  SENT: "blue",
  VIEWED: "purple",
  ACCEPTED: "green",
  REJECTED: "red",
  EXPIRED: "amber",
};

const statuses = ["ALL", "DRAFT", "SENT", "VIEWED", "ACCEPTED", "REJECTED", "EXPIRED"];

export default function ProposalsPage() {
  const [status, setStatus] = useState("ALL");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const { data, isLoading } = useProposals(status, page);

  const filtered = data?.data.filter(
    (p) =>
      p.proposalNumber.toLowerCase().includes(search.toLowerCase()) ||
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.client.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Proposals</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Create and manage business proposals
          </p>
        </div>
        <Link href="/proposals/new">
          <Button>
            <Plus className="h-4 w-4" />
            New Proposal
          </Button>
        </Link>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search proposals..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-gray-600 dark:bg-slate-800 dark:text-gray-100 dark:placeholder-gray-500"
          />
        </div>
        <div className="flex gap-1 overflow-x-auto">
          {statuses.map((s) => (
            <button
              key={s}
              onClick={() => {
                setStatus(s);
                setPage(1);
              }}
              className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                status === s
                  ? "bg-primary text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-slate-800 dark:text-gray-400 dark:hover:bg-slate-700"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : filtered && filtered.length > 0 ? (
        <Card className="overflow-hidden !p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-200 bg-gray-50 dark:border-slate-700 dark:bg-slate-800/50">
                <tr>
                  <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Number</th>
                  <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Title</th>
                  <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Client</th>
                  <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Status</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-500 dark:text-gray-400">Total</th>
                  <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Valid Until</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-700/50">
                {filtered.map((proposal) => (
                  <tr
                    key={proposal.id}
                    className="cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800/50"
                    onClick={() => (window.location.href = `/proposals/${proposal.id}`)}
                  >
                    <td className="px-4 py-3 font-mono text-sm font-medium text-gray-900 dark:text-white">
                      {proposal.proposalNumber}
                    </td>
                    <td className="max-w-[200px] truncate px-4 py-3 text-gray-700 dark:text-gray-300">
                      {proposal.title}
                    </td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                      {proposal.client.name}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={statusColors[proposal.status] ?? "gray"}>
                        {proposal.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-gray-900 dark:text-white">
                      {formatCurrency(proposal.total)}
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                      {formatDate(proposal.validUntil)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <div className="flex flex-col items-center justify-center py-12">
          <FileText className="h-12 w-12 text-gray-300" />
          <p className="mt-4 text-gray-500">No proposals found</p>
          <Link href="/proposals/new">
            <Button variant="ghost" className="mt-4">
              <Plus className="h-4 w-4" />
              Create Your First Proposal
            </Button>
          </Link>
        </div>
      )}

      {/* Pagination */}
      {data && data.pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Showing {(page - 1) * 10 + 1}–
            {Math.min(page * 10, data.pagination.total)} of{" "}
            {data.pagination.total}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= data.pagination.totalPages}
              onClick={() => setPage(page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
