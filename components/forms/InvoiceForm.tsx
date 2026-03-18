"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { ClientForm } from "@/components/forms/ClientForm";
import { LineItemEditor, LineItemData } from "@/components/forms/LineItemEditor";
import { AIGeneratePanel } from "@/components/ai/AIGenerateButton";
import { useClients, useCreateClient } from "@/hooks/useClients";
import { useCreateInvoice, useUpdateInvoice, InvoiceInput } from "@/hooks/useInvoices";

interface InvoiceFormData {
  clientId: string;
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  taxRate: number;
  discountType: string;
  discountValue: number;
  notes: string;
}

interface InvoiceFormProps {
  mode: "create" | "edit";
  invoiceId?: string;
  defaultValues?: Partial<InvoiceFormData> & {
    lineItems?: LineItemData[];
    aiGenerated?: boolean;
  };
}

export function InvoiceForm({ mode, invoiceId, defaultValues }: InvoiceFormProps) {
  const router = useRouter();
  const [clientModal, setClientModal] = useState(false);
  const [clientSearch, setClientSearch] = useState("");
  const [clientDropdownOpen, setClientDropdownOpen] = useState(false);
  const [lineItems, setLineItems] = useState<LineItemData[]>(
    defaultValues?.lineItems ?? [
      { id: `item-${Date.now()}`, description: "", quantity: 1, unitPrice: 0, total: 0 },
    ]
  );
  const [saving, setSaving] = useState(false);
  const [aiGenerated, setAiGenerated] = useState(defaultValues?.aiGenerated ?? false);

  const { data: clients } = useClients();
  const createClient = useCreateClient();
  const createInvoice = useCreateInvoice();
  const updateInvoice = useUpdateInvoice();

  const today = new Date().toISOString().split("T")[0];
  const in30Days = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  const autoInvoiceNumber = useMemo(
    () => defaultValues?.invoiceNumber ?? "",
    [defaultValues?.invoiceNumber]
  );

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<InvoiceFormData>({
    defaultValues: {
      clientId: defaultValues?.clientId ?? "",
      invoiceNumber: defaultValues?.invoiceNumber ?? autoInvoiceNumber,
      issueDate: defaultValues?.issueDate
        ? new Date(defaultValues.issueDate).toISOString().split("T")[0]
        : today,
      dueDate: defaultValues?.dueDate
        ? new Date(defaultValues.dueDate).toISOString().split("T")[0]
        : in30Days,
      taxRate: defaultValues?.taxRate ?? 0,
      discountType: defaultValues?.discountType ?? "none",
      discountValue: defaultValues?.discountValue ?? 0,
      notes: defaultValues?.notes ?? "",
    },
  });

  const clientId = watch("clientId");
  const taxRate = watch("taxRate");
  const discountType = watch("discountType");
  const discountValue = watch("discountValue");

  // Calculate totals
  const subtotal = lineItems.reduce((sum, item) => sum + item.total, 0);
  const taxAmount = subtotal * (taxRate / 100);
  let discountAmount = 0;
  if (discountType === "percentage") {
    discountAmount = subtotal * (discountValue / 100);
  } else if (discountType === "fixed") {
    discountAmount = discountValue;
  }
  const total = subtotal + taxAmount - discountAmount;

  const selectedClient = clients?.find((c) => c.id === clientId);
  const filteredClients = clients?.filter(
    (c) =>
      c.name.toLowerCase().includes(clientSearch.toLowerCase()) ||
      c.email.toLowerCase().includes(clientSearch.toLowerCase())
  );

  // Set auto invoice number once loaded
  useEffect(() => {
    if (!defaultValues?.invoiceNumber && autoInvoiceNumber) {
      setValue("invoiceNumber", autoInvoiceNumber);
    }
  }, [autoInvoiceNumber, defaultValues?.invoiceNumber, setValue]);

  useEffect(() => {
    if (mode !== "create" || defaultValues?.invoiceNumber) return;

    let isMounted = true;

    async function fetchNextNumber() {
      try {
        const res = await fetch("/api/invoices/next-number");
        const json = await res.json();
        if (!res.ok) return;
        if (isMounted) setValue("invoiceNumber", json.data.nextNumber);
      } catch {
        // Fall back to manual override if request fails.
      }
    }

    fetchNextNumber();

    return () => {
      isMounted = false;
    };
  }, [mode, defaultValues?.invoiceNumber, setValue]);

  useEffect(() => {
    if (mode !== "create") return;

    let isMounted = true;

    async function fetchDefaults() {
      try {
        const res = await fetch("/api/user/settings");
        const json = await res.json();
        if (!res.ok || !isMounted) return;

        if (!defaultValues?.taxRate) {
          setValue("taxRate", Number(json.data.defaultTaxRate ?? 0));
        }

        if (!defaultValues?.notes) {
          setValue(
            "notes",
            json.data.defaultPaymentTerms ?? "Payment due within 30 days. Thank you for your business."
          );
        }

        if (!defaultValues?.dueDate) {
          const dueDays = Number(json.data.defaultDueDays ?? 30);
          const dueDate = new Date(Date.now() + dueDays * 24 * 60 * 60 * 1000)
            .toISOString()
            .split("T")[0];
          setValue("dueDate", dueDate);
        }
      } catch {
        // Keep existing defaults if settings request fails.
      }
    }

    fetchDefaults();

    return () => {
      isMounted = false;
    };
  }, [mode, defaultValues?.dueDate, defaultValues?.notes, defaultValues?.taxRate, setValue]);

  const onSubmit = async (data: InvoiceFormData, status: string) => {
    if (lineItems.length === 0 || lineItems.every((i) => !i.description)) {
      return;
    }

    setSaving(true);
    try {
      const payload: InvoiceInput = {
        clientId: data.clientId,
        invoiceNumber: data.invoiceNumber,
        issueDate: new Date(data.issueDate).toISOString(),
        dueDate: new Date(data.dueDate).toISOString(),
        lineItems: lineItems.map((item, index) => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.total,
          order: index,
        })),
        subtotal,
        taxRate,
        taxAmount,
        discountType: discountType === "none" ? null : discountType,
        discountValue,
        discountAmount,
        total,
        notes: data.notes || undefined,
        status,
        aiGenerated,
      };

      let savedInvoiceId = invoiceId;
      if (mode === "edit" && invoiceId) {
        await updateInvoice.mutateAsync({ id: invoiceId, data: payload });
      } else {
        const created = await createInvoice.mutateAsync(payload);
        savedInvoiceId = created.id;
      }

      if (status === "GENERATE_PDF" && savedInvoiceId) {
        // Trigger PDF generation then redirect to detail page
        try {
          const res = await fetch(`/api/invoices/${savedInvoiceId}/pdf`, {
            method: "POST",
          });
          if (res.ok) {
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            window.open(url, "_blank");
          }
        } catch {
          // PDF generation failed, still redirect
        }
        router.push(`/invoices/${savedInvoiceId}`);
      } else {
        router.push("/invoices");
      }
    } catch {
      // Error handled by mutation
    } finally {
      setSaving(false);
    }
  };

  const handleAIGenerated = (data: {
    lineItems: LineItemData[];
    notes: string;
    suggestedDueDate: number;
  }) => {
    setLineItems(data.lineItems);
    setAiGenerated(true);
    setValue("notes", data.notes);
    // Set due date based on AI suggestion
    const dueDate = new Date(
      Date.now() + data.suggestedDueDate * 24 * 60 * 60 * 1000
    );
    setValue("dueDate", dueDate.toISOString().split("T")[0]);
  };

  return (
    <form className="space-y-6">
      {/* Section 1 — AI Generate Panel */}
      {mode === "create" && (
        <AIGeneratePanel
          clientName={selectedClient?.name ?? ""}
          onGenerated={handleAIGenerated}
        />
      )}

      {/* Section 2 — Client Selection */}
      <Card>
        <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
          Client
        </h2>
        <div className="flex gap-3">
          <div className="relative flex-1">
            <div
              className="flex cursor-pointer items-center rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-slate-800"
              onClick={() => setClientDropdownOpen(!clientDropdownOpen)}
            >
              {selectedClient ? (
                <span className="text-gray-900 dark:text-gray-100">
                  {selectedClient.name}{" "}
                  <span className="text-gray-400">({selectedClient.email})</span>
                </span>
              ) : (
                <span className="text-gray-400">Select a client...</span>
              )}
            </div>
            {clientDropdownOpen && (
              <div className="absolute z-20 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-800">
                <div className="border-b border-gray-200 p-2 dark:border-slate-700">
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search clients..."
                      value={clientSearch}
                      onChange={(e) => setClientSearch(e.target.value)}
                      className="w-full rounded border-0 bg-gray-50 py-1.5 pl-8 pr-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary dark:bg-slate-700 dark:text-gray-100"
                      autoFocus
                    />
                  </div>
                </div>
                <div className="max-h-48 overflow-y-auto p-1">
                  {filteredClients?.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      className="flex w-full items-center rounded px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-slate-700"
                      onClick={() => {
                        setValue("clientId", c.id);
                        setClientDropdownOpen(false);
                        setClientSearch("");
                      }}
                    >
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {c.name}
                        </p>
                        <p className="text-xs text-gray-400">{c.email}</p>
                      </div>
                    </button>
                  ))}
                  {(!filteredClients || filteredClients.length === 0) && (
                    <p className="px-3 py-2 text-sm text-gray-400">
                      No clients found
                    </p>
                  )}
                </div>
              </div>
            )}
            <input type="hidden" {...register("clientId", { required: "Client is required" })} />
            {errors.clientId && (
              <p className="mt-1 text-sm text-danger">{errors.clientId.message}</p>
            )}
          </div>
          <Button type="button" variant="outline" onClick={() => setClientModal(true)}>
            <Plus className="h-4 w-4" />
            New Client
          </Button>
        </div>
      </Card>

      {/* Section 3 — Invoice Details */}
      <Card>
        <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
          Invoice Details
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Input
            id="invoiceNumber"
            label="Invoice Number"
            {...register("invoiceNumber", { required: "Invoice number is required" })}
            error={errors.invoiceNumber?.message}
          />
          <Input
            id="issueDate"
            label="Issue Date"
            type="date"
            {...register("issueDate", { required: "Issue date is required" })}
            error={errors.issueDate?.message}
          />
          <Input
            id="dueDate"
            label="Due Date"
            type="date"
            {...register("dueDate", { required: "Due date is required" })}
            error={errors.dueDate?.message}
          />
        </div>
      </Card>

      {/* Section 4 — Line Items */}
      <Card>
        <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
          Line Items
        </h2>
        <LineItemEditor items={lineItems} onChange={setLineItems} />
      </Card>

      {/* Section 5 — Totals */}
      <Card>
        <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
          Totals
        </h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500 dark:text-gray-400">Subtotal</span>
            <span className="font-mono font-medium text-gray-900 dark:text-white">
              ${subtotal.toFixed(2)}
            </span>
          </div>

          {/* Discount */}
          <div className="flex items-center gap-3">
            <label className="text-sm text-gray-500 dark:text-gray-400">
              Discount
            </label>
            <Controller
              control={control}
              name="discountType"
              render={({ field }) => (
                <select
                  {...field}
                  className="rounded border border-gray-300 bg-white px-2 py-1 text-sm dark:border-gray-600 dark:bg-slate-800 dark:text-gray-100"
                >
                  <option value="none">None</option>
                  <option value="percentage">Percentage</option>
                  <option value="fixed">Fixed Amount</option>
                </select>
              )}
            />
            {discountType !== "none" && (
              <Input
                type="number"
                min="0"
                step="0.01"
                className="w-28"
                {...register("discountValue", { valueAsNumber: true })}
              />
            )}
            {discountAmount > 0 && (
              <span className="ml-auto font-mono text-sm text-danger">
                -${discountAmount.toFixed(2)}
              </span>
            )}
          </div>

          {/* Tax */}
          <div className="flex items-center gap-3">
            <label className="text-sm text-gray-500 dark:text-gray-400">
              Tax Rate (%)
            </label>
            <Input
              type="number"
              min="0"
              step="0.1"
              className="w-24"
              {...register("taxRate", { valueAsNumber: true })}
            />
            {taxAmount > 0 && (
              <span className="ml-auto font-mono text-sm text-gray-900 dark:text-white">
                +${taxAmount.toFixed(2)}
              </span>
            )}
          </div>

          <div className="border-t border-gray-200 pt-3 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <span className="text-lg font-semibold text-gray-900 dark:text-white">
                Total
              </span>
              <span className="text-2xl font-bold text-gray-900 dark:text-white">
                ${total.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Section 6 — Notes */}
      <Card>
        <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
          Notes
        </h2>
        <textarea
          rows={3}
          placeholder="Payment terms, special instructions, thank-you note..."
          className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-gray-600 dark:bg-slate-800 dark:text-gray-100 dark:placeholder-gray-500"
          {...register("notes")}
        />
      </Card>

      {/* Actions — sticky bottom bar */}
      <div className="sticky bottom-0 -mx-4 border-t border-gray-200 bg-white/80 px-4 py-4 backdrop-blur dark:border-slate-700 dark:bg-slate-900/80 lg:-mx-6 lg:px-6">
        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            variant="secondary"
            loading={saving}
            onClick={handleSubmit((data) => onSubmit(data, "DRAFT"))}
          >
            Save as Draft
          </Button>
          <Button
            type="button"
            loading={saving}
            onClick={handleSubmit((data) => onSubmit(data, "GENERATE_PDF"))}
          >
            Save &amp; Generate PDF
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>
      </div>

      {/* New Client Modal */}
      <Modal
        open={clientModal}
        onClose={() => setClientModal(false)}
        title="Add New Client"
      >
        <ClientForm
          loading={createClient.isPending}
          onSubmit={(data) => {
            createClient.mutate(data, {
              onSuccess: (newClient) => {
                setValue("clientId", newClient.id);
                setClientModal(false);
              },
            });
          }}
        />
      </Modal>
    </form>
  );
}
