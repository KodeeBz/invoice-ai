"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Users, Search, Trash2, Pencil, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { Skeleton } from "@/components/ui/skeleton";
import { ClientForm } from "@/components/forms/ClientForm";
import {
  useClients,
  useCreateClient,
  useDeleteClient,
} from "@/hooks/useClients";

export default function ClientsPage() {
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState("");

  const { data: clients, isLoading } = useClients();
  const createClient = useCreateClient();
  const deleteClient = useDeleteClient();

  const filtered = clients?.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase()) ||
      c.company?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Clients
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Manage your client contacts
          </p>
        </div>
        <Button onClick={() => setShowModal(true)}>
          <Plus className="h-4 w-4" />
          Add Client
        </Button>
      </div>

      {/* Search */}
      <div className="max-w-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search clients..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="block w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-3 text-sm text-gray-900 placeholder-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-gray-600 dark:bg-slate-800 dark:text-gray-100 dark:placeholder-gray-500"
          />
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <Card>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Empty state */}
      {!isLoading && (!clients || clients.length === 0) && (
        <Card className="flex flex-col items-center justify-center py-12">
          <Users className="h-12 w-12 text-gray-300 dark:text-gray-600" />
          <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
            No clients yet
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Add your first client to start creating invoices
          </p>
          <Button className="mt-4" onClick={() => setShowModal(true)}>
            <Plus className="h-4 w-4" />
            Add Client
          </Button>
        </Card>
      )}

      {/* Client table */}
      {!isLoading && filtered && filtered.length > 0 && (
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-200 bg-gray-50 dark:border-slate-700 dark:bg-slate-800/50">
                <tr>
                  <th className="px-6 py-3 font-medium text-gray-500 dark:text-gray-400">
                    Name
                  </th>
                  <th className="px-6 py-3 font-medium text-gray-500 dark:text-gray-400">
                    Company
                  </th>
                  <th className="px-6 py-3 font-medium text-gray-500 dark:text-gray-400">
                    Email
                  </th>
                  <th className="px-6 py-3 font-medium text-gray-500 dark:text-gray-400">
                    Invoices
                  </th>
                  <th className="px-6 py-3 font-medium text-gray-500 dark:text-gray-400">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                {filtered.map((client) => (
                  <tr
                    key={client.id}
                    className="hover:bg-gray-50 dark:hover:bg-slate-800/50"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                          {client.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase()
                            .slice(0, 2)}
                        </div>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {client.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                      {client.company || "—"}
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                      {client.email}
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                      {client._count?.invoices ?? 0}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Link href={`/clients/${client.id}`}>
                          <button className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-slate-700 dark:hover:text-gray-300">
                            <Eye className="h-4 w-4" />
                          </button>
                        </Link>
                        <Link href={`/clients/${client.id}`}>
                          <button className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-slate-700 dark:hover:text-gray-300">
                            <Pencil className="h-4 w-4" />
                          </button>
                        </Link>
                        <button
                          onClick={() => {
                            if (confirm("Delete this client?")) {
                              deleteClient.mutate(client.id);
                            }
                          }}
                          className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-danger dark:hover:bg-red-900/20"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Search no results */}
      {!isLoading && filtered && filtered.length === 0 && clients && clients.length > 0 && (
        <Card className="py-8 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No clients match &quot;{search}&quot;
          </p>
        </Card>
      )}

      {/* Add Client Modal */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title="Add New Client"
      >
        <ClientForm
          loading={createClient.isPending}
          onSubmit={(data) => {
            createClient.mutate(data, {
              onSuccess: () => setShowModal(false),
            });
          }}
        />
      </Modal>
    </div>
  );
}
