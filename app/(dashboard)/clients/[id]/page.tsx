"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Pencil,
  Mail,
  Phone,
  Building2,
  MapPin,
  FileText,
  FileSpreadsheet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Skeleton } from "@/components/ui/skeleton";
import { ClientForm } from "@/components/forms/ClientForm";
import { useClient, useUpdateClient } from "@/hooks/useClients";
import { formatCurrency, formatDate } from "@/lib/utils";

const statusColors: Record<string, "gray" | "blue" | "green" | "red" | "purple" | "amber"> = {
  DRAFT: "gray",
  SENT: "blue",
  VIEWED: "purple",
  PAID: "green",
  OVERDUE: "red",
  CANCELLED: "gray",
  ACCEPTED: "green",
  REJECTED: "red",
  EXPIRED: "amber",
};

export default function ClientDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const [editModal, setEditModal] = useState(false);

  const { data: client, isLoading } = useClient(params.id);
  const updateClient = useUpdateClient();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-gray-500">Client not found</p>
        <Button variant="ghost" className="mt-4" onClick={() => router.push("/clients")}>
          Back to Clients
        </Button>
      </div>
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const clientData = client as any;
  const invoices = clientData.invoices as Array<{
    id: string;
    invoiceNumber: string;
    status: string;
    total: number;
    issueDate: string;
  }> | undefined;

  const proposals = clientData.proposals as Array<{
    id: string;
    proposalNumber: string;
    title: string;
    status: string;
    total: number;
    createdAt: string;
  }> | undefined;

  const paidTotal = invoices
    ?.filter((inv) => inv.status === "PAID")
    .reduce((sum, inv) => sum + inv.total, 0) ?? 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/clients">
          <button className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800">
            <ArrowLeft className="h-5 w-5" />
          </button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {client.name}
          </h1>
          {client.company && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {client.company}
            </p>
          )}
        </div>
        <Button variant="outline" onClick={() => setEditModal(true)}>
          <Pencil className="h-4 w-4" />
          Edit
        </Button>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Contact Info */}
        <Card className="lg:col-span-1">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Contact Info
          </h2>
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <Mail className="h-4 w-4 text-gray-400" />
              <span className="text-gray-700 dark:text-gray-300">
                {client.email}
              </span>
            </div>
            {client.phone && (
              <div className="flex items-center gap-3 text-sm">
                <Phone className="h-4 w-4 text-gray-400" />
                <span className="text-gray-700 dark:text-gray-300">
                  {client.phone}
                </span>
              </div>
            )}
            {client.company && (
              <div className="flex items-center gap-3 text-sm">
                <Building2 className="h-4 w-4 text-gray-400" />
                <span className="text-gray-700 dark:text-gray-300">
                  {client.company}
                </span>
              </div>
            )}
            {client.address && (
              <div className="flex items-center gap-3 text-sm">
                <MapPin className="h-4 w-4 text-gray-400" />
                <span className="text-gray-700 dark:text-gray-300">
                  {client.address}
                </span>
              </div>
            )}
          </div>

          {/* Revenue */}
          <div className="mt-6 border-t border-gray-200 pt-4 dark:border-slate-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Total Revenue
            </p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {formatCurrency(paidTotal)}
            </p>
          </div>
        </Card>

        {/* Invoices & Proposals */}
        <div className="space-y-6 lg:col-span-2">
          {/* Invoices */}
          <Card>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                <FileText className="h-4 w-4" />
                Invoices ({invoices?.length ?? 0})
              </h2>
              <Link href="/invoices/new">
                <Button size="sm">New Invoice</Button>
              </Link>
            </div>
            {!invoices || invoices.length === 0 ? (
              <p className="py-4 text-center text-sm text-gray-400">
                No invoices for this client yet
              </p>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-slate-700">
                {invoices.map((inv) => (
                  <Link
                    key={inv.id}
                    href={`/invoices/${inv.id}`}
                    className="flex items-center justify-between py-3 hover:bg-gray-50 dark:hover:bg-slate-800/50 -mx-6 px-6"
                  >
                    <div>
                      <span className="font-mono text-sm font-medium text-gray-900 dark:text-white">
                        {inv.invoiceNumber}
                      </span>
                      <p className="text-xs text-gray-500">
                        {formatDate(inv.issueDate)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={statusColors[inv.status] ?? "gray"}>
                        {inv.status}
                      </Badge>
                      <span className="font-mono text-sm font-medium text-gray-900 dark:text-white">
                        {formatCurrency(inv.total)}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </Card>

          {/* Proposals */}
          <Card>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                <FileSpreadsheet className="h-4 w-4" />
                Proposals ({proposals?.length ?? 0})
              </h2>
              <Link href="/proposals/new">
                <Button size="sm">New Proposal</Button>
              </Link>
            </div>
            {!proposals || proposals.length === 0 ? (
              <p className="py-4 text-center text-sm text-gray-400">
                No proposals for this client yet
              </p>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-slate-700">
                {proposals.map((prop) => (
                  <Link
                    key={prop.id}
                    href={`/proposals/${prop.id}`}
                    className="flex items-center justify-between py-3 hover:bg-gray-50 dark:hover:bg-slate-800/50 -mx-6 px-6"
                  >
                    <div>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {prop.title}
                      </span>
                      <p className="text-xs text-gray-500">
                        {prop.proposalNumber} &middot;{" "}
                        {formatDate(prop.createdAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={statusColors[prop.status] ?? "gray"}>
                        {prop.status}
                      </Badge>
                      <span className="font-mono text-sm font-medium text-gray-900 dark:text-white">
                        {formatCurrency(prop.total)}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Edit Modal */}
      <Modal
        open={editModal}
        onClose={() => setEditModal(false)}
        title="Edit Client"
      >
        <ClientForm
          defaultValues={{
            name: client.name,
            email: client.email,
            phone: client.phone ?? "",
            company: client.company ?? "",
            address: client.address ?? "",
            notes: client.notes ?? "",
          }}
          loading={updateClient.isPending}
          submitLabel="Update Client"
          onSubmit={(data) => {
            updateClient.mutate(
              { id: params.id, data },
              { onSuccess: () => setEditModal(false) }
            );
          }}
        />
      </Modal>
    </div>
  );
}
