"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ProposalForm } from "@/components/forms/ProposalForm";

export default function NewProposalPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/proposals">
          <button className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800">
            <ArrowLeft className="h-5 w-5" />
          </button>
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          New Proposal
        </h1>
      </div>
      <ProposalForm mode="create" />
    </div>
  );
}
