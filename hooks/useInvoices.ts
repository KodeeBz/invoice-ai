"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export interface LineItem {
  id?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  order: number;
}

export interface Invoice {
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
  aiGenerated: boolean;
  createdAt: string;
  clientId: string;
  client: {
    id: string;
    name: string;
    email: string;
  };
  lineItems: LineItem[];
  user?: {
    name: string;
    businessName: string | null;
    businessLogo: string | null;
    address: string | null;
    phone: string | null;
    taxNumber: string | null;
    currency: string;
  };
}

export interface InvoiceInput {
  clientId: string;
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  lineItems: Omit<LineItem, "id">[];
  subtotal: number;
  taxRate?: number;
  taxAmount?: number;
  discountType?: string | null;
  discountValue?: number;
  discountAmount?: number;
  total: number;
  notes?: string;
  status?: string;
  aiGenerated?: boolean;
}

interface InvoiceListResponse {
  data: Invoice[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

async function fetchInvoices(
  status?: string,
  page = 1,
  limit = 10
): Promise<InvoiceListResponse> {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (status && status !== "ALL") params.set("status", status);

  const res = await fetch(`/api/invoices?${params}`);
  if (!res.ok) throw new Error("Failed to fetch invoices");
  return res.json();
}

async function fetchInvoice(id: string): Promise<Invoice> {
  const res = await fetch(`/api/invoices/${id}`);
  if (!res.ok) throw new Error("Failed to fetch invoice");
  const json = await res.json();
  return json.data;
}

async function createInvoice(data: InvoiceInput): Promise<Invoice> {
  const res = await fetch("/api/invoices", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const json = await res.json();
    throw new Error(json.error || "Failed to create invoice");
  }
  const json = await res.json();
  return json.data;
}

async function updateInvoice({
  id,
  data,
}: {
  id: string;
  data: Partial<InvoiceInput>;
}): Promise<Invoice> {
  const res = await fetch(`/api/invoices/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const json = await res.json();
    throw new Error(json.error || "Failed to update invoice");
  }
  const json = await res.json();
  return json.data;
}

async function deleteInvoice(id: string): Promise<void> {
  const res = await fetch(`/api/invoices/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete invoice");
}

async function updateInvoiceStatus({
  id,
  status,
}: {
  id: string;
  status: string;
}): Promise<Invoice> {
  const res = await fetch(`/api/invoices/${id}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error("Failed to update status");
  const json = await res.json();
  return json.data;
}

export function useInvoices(status?: string, page = 1, limit = 10) {
  return useQuery({
    queryKey: ["invoices", status, page, limit],
    queryFn: () => fetchInvoices(status, page, limit),
  });
}

export function useInvoice(id: string) {
  return useQuery({
    queryKey: ["invoices", id],
    queryFn: () => fetchInvoice(id),
    enabled: !!id,
  });
}

export function useCreateInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createInvoice,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      toast.success("Invoice created");
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useUpdateInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateInvoice,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      toast.success("Invoice updated");
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useDeleteInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteInvoice,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      toast.success("Invoice deleted");
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useUpdateInvoiceStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateInvoiceStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      toast.success("Status updated");
    },
    onError: (error: Error) => toast.error(error.message),
  });
}
