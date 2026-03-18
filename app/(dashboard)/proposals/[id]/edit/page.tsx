"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ProposalForm } from "@/components/forms/ProposalForm";
import { useProposal } from "@/hooks/useProposals";

export default function EditProposalPage({
  params,
}: {
  params: { id: string };
}) {
  const { data: proposal, isLoading } = useProposal(params.id);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!proposal) {
    return (
      <div className="py-12 text-center text-gray-500">Proposal not found</div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/proposals/${params.id}`}>
          <button className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800">
            <ArrowLeft className="h-5 w-5" />
          </button>
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Edit Proposal
        </h1>
      </div>
      <ProposalForm
        mode="edit"
        proposalId={params.id}
        defaultValues={{
          clientId: proposal.clientId,
          proposalNumber: proposal.proposalNumber,
          title: proposal.title,
          validUntil: proposal.validUntil,
          total: proposal.total,
          aiGenerated: proposal.aiGenerated,
          sections: proposal.sections.map((s) => ({
            id: s.id || `section-${Date.now()}-${Math.random()}`,
            title: s.title,
            content: s.content,
          })),
        }}
      />
    </div>
  );
}
