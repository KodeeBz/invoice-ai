"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export interface ProposalSection {
  id?: string;
  title: string;
  content: string;
  order: number;
}

export interface Proposal {
  id: string;
  proposalNumber: string;
  status: string;
  title: string;
  validUntil: string;
  total: number;
  pdfUrl: string | null;
  aiGenerated: boolean;
  createdAt: string;
  clientId: string;
  client: {
    id: string;
    name: string;
    email: string;
  };
  sections: ProposalSection[];
  user?: {
    name: string;
    businessName: string | null;
    businessLogo: string | null;
    address: string | null;
    phone: string | null;
    taxNumber: string | null;
  };
}

export interface ProposalInput {
  clientId: string;
  proposalNumber: string;
  title: string;
  validUntil: string;
  sections: Omit<ProposalSection, "id">[];
  total: number;
  status?: string;
  aiGenerated?: boolean;
}

interface ProposalListResponse {
  data: Proposal[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

async function fetchProposals(
  status?: string,
  page = 1,
  limit = 10
): Promise<ProposalListResponse> {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (status && status !== "ALL") params.set("status", status);

  const res = await fetch(`/api/proposals?${params}`);
  if (!res.ok) throw new Error("Failed to fetch proposals");
  return res.json();
}

async function fetchProposal(id: string): Promise<Proposal> {
  const res = await fetch(`/api/proposals/${id}`);
  if (!res.ok) throw new Error("Failed to fetch proposal");
  const json = await res.json();
  return json.data;
}

async function createProposal(data: ProposalInput): Promise<Proposal> {
  const res = await fetch("/api/proposals", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const json = await res.json();
    throw new Error(json.error || "Failed to create proposal");
  }
  const json = await res.json();
  return json.data;
}

async function updateProposal({
  id,
  data,
}: {
  id: string;
  data: Partial<ProposalInput>;
}): Promise<Proposal> {
  const res = await fetch(`/api/proposals/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const json = await res.json();
    throw new Error(json.error || "Failed to update proposal");
  }
  const json = await res.json();
  return json.data;
}

async function deleteProposal(id: string): Promise<void> {
  const res = await fetch(`/api/proposals/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete proposal");
}

async function updateProposalStatus({
  id,
  status,
}: {
  id: string;
  status: string;
}): Promise<Proposal> {
  const res = await fetch(`/api/proposals/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error("Failed to update status");
  const json = await res.json();
  return json.data;
}

export function useProposals(status?: string, page = 1, limit = 10) {
  return useQuery({
    queryKey: ["proposals", status, page, limit],
    queryFn: () => fetchProposals(status, page, limit),
  });
}

export function useProposal(id: string) {
  return useQuery({
    queryKey: ["proposals", id],
    queryFn: () => fetchProposal(id),
    enabled: !!id,
  });
}

export function useCreateProposal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createProposal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["proposals"] });
      toast.success("Proposal created");
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useUpdateProposal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateProposal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["proposals"] });
      toast.success("Proposal updated");
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useDeleteProposal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteProposal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["proposals"] });
      toast.success("Proposal deleted");
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useUpdateProposalStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateProposalStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["proposals"] });
      toast.success("Status updated");
    },
    onError: (error: Error) => toast.error(error.message),
  });
}
