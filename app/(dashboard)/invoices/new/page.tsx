"use client";

import { InvoiceForm } from "@/components/forms/InvoiceForm";

export default function NewInvoicePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          New Invoice
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Create a new invoice for your client
        </p>
      </div>

      <InvoiceForm mode="create" />
    </div>
  );
}
