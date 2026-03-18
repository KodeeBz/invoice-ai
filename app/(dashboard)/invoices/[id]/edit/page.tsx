"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { InvoiceForm } from "@/components/forms/InvoiceForm";
import { useInvoice } from "@/hooks/useInvoices";

export default function EditInvoicePage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const { data: invoice, isLoading } = useInvoice(params.id);

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
        <p className="text-gray-500">Invoice not found</p>
        <Button variant="ghost" className="mt-4" onClick={() => router.push("/invoices")}>
          Back to Invoices
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Edit Invoice {invoice.invoiceNumber}
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Update invoice details
        </p>
      </div>

      <InvoiceForm
        mode="edit"
        invoiceId={params.id}
        defaultValues={{
          clientId: invoice.clientId,
          invoiceNumber: invoice.invoiceNumber,
          issueDate: invoice.issueDate,
          dueDate: invoice.dueDate,
          taxRate: invoice.taxRate,
          discountType: invoice.discountType ?? "none",
          discountValue: invoice.discountValue,
          notes: invoice.notes ?? "",
          aiGenerated: invoice.aiGenerated,
          lineItems: invoice.lineItems.map((item, i) => ({
            id: item.id ?? `item-${i}`,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            total: item.total,
          })),
        }}
      />
    </div>
  );
}
