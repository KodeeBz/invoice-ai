"use client";

import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

interface AIInvoiceRequest {
  clientName: string;
  clientEmail?: string;
  projectDescription: string;
  projectType: string;
  estimatedHours?: number | null;
  hourlyRate?: number | null;
  fixedPrice?: number | null;
  additionalContext?: string;
}

interface AIInvoiceResponse {
  lineItems: {
    description: string;
    quantity: number;
    unitPrice: number;
  }[];
  notes: string;
  suggestedDueDate: number;
}

interface AIProposalRequest {
  clientName: string;
  projectTitle: string;
  projectDescription: string;
  timeline: string;
  budget?: number | null;
  projectType: string;
  yourExperience?: string;
}

interface AIProposalResponse {
  title: string;
  sections: {
    title: string;
    content: string;
  }[];
  total: number;
}

async function generateInvoice(
  data: AIInvoiceRequest
): Promise<AIInvoiceResponse> {
  const res = await fetch("/api/ai/generate-invoice", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const json = await res.json();
    throw new Error(json.error || "AI generation failed");
  }

  const json = await res.json();
  return json.data;
}

async function generateProposal(
  data: AIProposalRequest
): Promise<AIProposalResponse> {
  const res = await fetch("/api/ai/generate-proposal", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const json = await res.json();
    throw new Error(json.error || "AI generation failed");
  }

  const json = await res.json();
  return json.data;
}

export function useAIGenerateInvoice() {
  return useMutation({
    mutationFn: generateInvoice,
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useAIGenerateProposal() {
  return useMutation({
    mutationFn: generateProposal,
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
