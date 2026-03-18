"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  DollarSign,
  Clock,
  FileText,
  Users,
  Plus,
  FileSpreadsheet,
} from "lucide-react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useDashboard } from "@/hooks/useDashboard";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const invoiceStatusColors: Record<
  string,
  "gray" | "blue" | "green" | "red" | "purple" | "amber"
> = {
  DRAFT: "gray",
  SENT: "blue",
  VIEWED: "purple",
  PAID: "green",
  OVERDUE: "red",
  CANCELLED: "gray",
};

const proposalStatusColors: Record<
  string,
  "gray" | "blue" | "green" | "red" | "purple" | "amber"
> = {
  DRAFT: "gray",
  SENT: "blue",
  VIEWED: "purple",
  ACCEPTED: "green",
  REJECTED: "red",
  EXPIRED: "amber",
};

export default function DashboardPage() {
  const { data: session } = useSession();
  const { data: dashboard, isLoading } = useDashboard();

  const stats = [
    {
      label: "Total Revenue",
      value: formatCurrency(dashboard?.totalRevenue ?? 0, dashboard?.currency),
      icon: DollarSign,
      color: "text-success",
      bg: "bg-green-100 dark:bg-green-900/30",
    },
    {
      label: "Outstanding",
      value: formatCurrency(dashboard?.outstandingAmount ?? 0, dashboard?.currency),
      icon: Clock,
      color: "text-warning",
      bg: "bg-amber-100 dark:bg-amber-900/30",
    },
    {
      label: "Total Invoices",
      value: String(dashboard?.totalInvoices ?? 0),
      icon: FileText,
      color: "text-primary",
      bg: "bg-blue-100 dark:bg-blue-900/30",
    },
    {
      label: "Total Clients",
      value: String(dashboard?.totalClients ?? 0),
      icon: Users,
      color: "text-purple-600 dark:text-purple-400",
      bg: "bg-purple-100 dark:bg-purple-900/30",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Welcome back, {session?.user?.name?.split(" ")[0] ?? "there"}
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Here&apos;s an overview of your business
        </p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {isLoading
          ? Array.from({ length: 4 }).map((_, index) => (
              <Card key={index} className="flex items-center gap-4">
                <Skeleton className="h-12 w-12 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-7 w-28" />
                </div>
              </Card>
            ))
          : stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.08 }}
              >
                <Card className="flex items-center gap-4">
                  <div
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg ${stat.bg}`}
                  >
                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {stat.label}
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {stat.value}
                    </p>
                  </div>
                </Card>
              </motion.div>
            ))}
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3">
        <Link href="/invoices/new">
          <Button size="md">
            <Plus className="h-4 w-4" />
            New Invoice
          </Button>
        </Link>
        <Link href="/proposals/new">
          <Button variant="secondary" size="md">
            <FileSpreadsheet className="h-4 w-4" />
            New Proposal
          </Button>
        </Link>
        <Link href="/clients">
          <Button variant="outline" size="md">
            <Users className="h-4 w-4" />
            Add Client
          </Button>
        </Link>
      </div>

      {/* Revenue Chart */}
      <Card>
        <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
          Revenue (Last 6 Months)
        </h2>
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-64 w-full" />
          </div>
        ) : (
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dashboard?.monthlyRevenue ?? []}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0.03} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="month" tick={{ fill: "#6B7280", fontSize: 12 }} />
                <YAxis
                  tick={{ fill: "#6B7280", fontSize: 12 }}
                  tickFormatter={(value) =>
                    formatCurrency(Number(value), dashboard?.currency)
                  }
                />
                <Tooltip
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  formatter={(value: any) =>
                    formatCurrency(Number(value), dashboard?.currency)
                  }
                  labelClassName="text-xs"
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#2563EB"
                  strokeWidth={2.5}
                  fill="url(#revenueGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* Recent Invoices */}
        <Card className="overflow-hidden p-0">
          <div className="border-b border-gray-200 px-6 py-4 dark:border-slate-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Recent Invoices
            </h2>
          </div>

          {isLoading ? (
            <div className="space-y-4 p-6">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="flex items-center gap-3">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 flex-1" />
                  <Skeleton className="h-4 w-20" />
                </div>
              ))}
            </div>
          ) : !dashboard?.recentInvoices.length ? (
            <div className="flex h-48 items-center justify-center px-6 py-6">
              <div className="text-center">
                <FileText className="mx-auto h-8 w-8 text-gray-300 dark:text-gray-600" />
                <p className="mt-2 text-sm text-gray-400 dark:text-gray-500">
                  No invoices yet
                </p>
                <Link href="/invoices/new">
                  <Button variant="ghost" size="sm" className="mt-2">
                    Create your first invoice
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
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
                      Total
                    </th>
                    <th className="px-6 py-3 font-medium text-gray-500 dark:text-gray-400">
                      Status
                    </th>
                    <th className="px-6 py-3 font-medium text-gray-500 dark:text-gray-400">
                      Due
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                  {dashboard.recentInvoices.map((invoice) => (
                    <tr
                      key={invoice.id}
                      className="cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800/40"
                      onClick={() => (window.location.href = `/invoices/${invoice.id}`)}
                    >
                      <td className="px-6 py-3 font-mono font-medium text-gray-900 dark:text-white">
                        {invoice.invoiceNumber}
                      </td>
                      <td className="px-6 py-3 text-gray-600 dark:text-gray-300">
                        {invoice.client.name}
                      </td>
                      <td className="px-6 py-3 font-mono text-gray-900 dark:text-white">
                        {formatCurrency(invoice.total, dashboard.currency)}
                      </td>
                      <td className="px-6 py-3">
                        <Badge variant={invoiceStatusColors[invoice.status] ?? "gray"}>
                          {invoice.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-3 text-gray-500 dark:text-gray-400">
                        {formatDate(invoice.dueDate)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Recent Proposals */}
        <Card className="overflow-hidden p-0">
          <div className="border-b border-gray-200 px-6 py-4 dark:border-slate-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Recent Proposals
            </h2>
          </div>

          {isLoading ? (
            <div className="space-y-4 p-6">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="flex items-center gap-3">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 flex-1" />
                  <Skeleton className="h-4 w-20" />
                </div>
              ))}
            </div>
          ) : !dashboard?.recentProposals.length ? (
            <div className="flex h-48 items-center justify-center px-6 py-6">
              <div className="text-center">
                <FileSpreadsheet className="mx-auto h-8 w-8 text-gray-300 dark:text-gray-600" />
                <p className="mt-2 text-sm text-gray-400 dark:text-gray-500">
                  No proposals yet
                </p>
                <Link href="/proposals/new">
                  <Button variant="ghost" size="sm" className="mt-2">
                    Create your first proposal
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-gray-200 bg-gray-50 dark:border-slate-700 dark:bg-slate-800/50">
                  <tr>
                    <th className="px-6 py-3 font-medium text-gray-500 dark:text-gray-400">
                      Proposal
                    </th>
                    <th className="px-6 py-3 font-medium text-gray-500 dark:text-gray-400">
                      Client
                    </th>
                    <th className="px-6 py-3 font-medium text-gray-500 dark:text-gray-400">
                      Total
                    </th>
                    <th className="px-6 py-3 font-medium text-gray-500 dark:text-gray-400">
                      Status
                    </th>
                    <th className="px-6 py-3 font-medium text-gray-500 dark:text-gray-400">
                      Valid Until
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                  {dashboard.recentProposals.map((proposal) => (
                    <tr
                      key={proposal.id}
                      className="cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800/40"
                      onClick={() => (window.location.href = `/proposals/${proposal.id}`)}
                    >
                      <td className="px-6 py-3 font-mono font-medium text-gray-900 dark:text-white">
                        {proposal.proposalNumber}
                      </td>
                      <td className="px-6 py-3 text-gray-600 dark:text-gray-300">
                        {proposal.client.name}
                      </td>
                      <td className="px-6 py-3 font-mono text-gray-900 dark:text-white">
                        {formatCurrency(proposal.total, dashboard.currency)}
                      </td>
                      <td className="px-6 py-3">
                        <Badge variant={proposalStatusColors[proposal.status] ?? "gray"}>
                          {proposal.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-3 text-gray-500 dark:text-gray-400">
                        {formatDate(proposal.validUntil)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
