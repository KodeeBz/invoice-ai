"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Pencil,
  Download,
  Send,
  CheckCircle,
  XCircle,
  FileText,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Skeleton } from "@/components/ui/skeleton";
import { useProposal, useUpdateProposalStatus } from "@/hooks/useProposals";
import { formatCurrency, formatDate } from "@/lib/utils";

const statusColors: Record<string, "gray" | "blue" | "green" | "red" | "purple" | "amber"> = {
  DRAFT: "gray",
  SENT: "blue",
  VIEWED: "purple",
  ACCEPTED: "green",
  REJECTED: "red",
  EXPIRED: "amber",
};

export default function ProposalDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [sendModal, setSendModal] = useState(false);
  const [sending, setSending] = useState(false);
  const [personalMessage, setPersonalMessage] = useState("");
  const { data: proposal, isLoading, refetch } = useProposal(params.id);
  const updateStatus = useUpdateProposalStatus();

  const handleGeneratePdf = async () => {
    setGeneratingPdf(true);
    try {
      const res = await fetch(`/api/proposals/${params.id}/pdf`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("PDF generation failed");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
      await refetch();
      toast.success("PDF generated successfully");
    } catch {
      toast.error("Failed to generate PDF");
    } finally {
      setGeneratingPdf(false);
    }
  };

  const handleSendEmail = async () => {
    setSending(true);
    try {
      const res = await fetch(`/api/proposals/${params.id}/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ personalMessage: personalMessage || undefined }),
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || "Failed to send");
      }
      await refetch();
      setSendModal(false);
      setPersonalMessage("");
      toast.success("Proposal sent to client!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send email");
    } finally {
      setSending(false);
    }
  };

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
      <div className="flex flex-col items-center justify-center py-12">
        <FileText className="h-12 w-12 text-gray-300" />
        <p className="mt-4 text-gray-500">Proposal not found</p>
        <Button variant="ghost" className="mt-4" onClick={() => router.push("/proposals")}>
          Back to Proposals
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-4">
        <Link href="/proposals">
          <button className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800">
            <ArrowLeft className="h-5 w-5" />
          </button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="font-mono text-2xl font-bold text-gray-900 dark:text-white">
              {proposal.proposalNumber}
            </h1>
            <Badge variant={statusColors[proposal.status] ?? "gray"}>
              {proposal.status}
            </Badge>
            {proposal.aiGenerated && (
              <Badge variant="amber">AI Generated</Badge>
            )}
          </div>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            For {proposal.client.name}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {proposal.status !== "ACCEPTED" && proposal.status !== "REJECTED" && (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  updateStatus.mutate({ id: proposal.id, status: "ACCEPTED" })
                }
              >
                <CheckCircle className="h-4 w-4" />
                Mark Accepted
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  updateStatus.mutate({ id: proposal.id, status: "REJECTED" })
                }
              >
                <XCircle className="h-4 w-4" />
                Mark Rejected
              </Button>
            </>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={handleGeneratePdf}
            disabled={generatingPdf}
          >
            {generatingPdf ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            {generatingPdf ? "Generating..." : "Generate PDF"}
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={!proposal.pdfUrl}
            onClick={() => setSendModal(true)}
          >
            <Send className="h-4 w-4" />
            Send
          </Button>
          <Link href={`/proposals/${proposal.id}/edit`}>
            <Button size="sm">
              <Pencil className="h-4 w-4" />
              Edit
            </Button>
          </Link>
        </div>
      </div>

      {/* Proposal Preview */}
      <Card className="mx-auto max-w-3xl">
        {/* Header section */}
        <div className="flex justify-between border-b border-gray-200 pb-6 dark:border-slate-700">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {proposal.user?.businessName ?? proposal.user?.name ?? ""}
            </h2>
            {proposal.user?.address && (
              <p className="mt-1 text-sm text-gray-500">{proposal.user.address}</p>
            )}
            {proposal.user?.phone && (
              <p className="text-sm text-gray-500">{proposal.user.phone}</p>
            )}
          </div>
          <div className="text-right">
            <p className="font-mono text-2xl font-bold text-primary">PROPOSAL</p>
            <p className="mt-1 font-mono text-sm text-gray-500">
              {proposal.proposalNumber}
            </p>
          </div>
        </div>

        {/* Title */}
        <h2 className="mt-6 text-xl font-bold text-gray-900 dark:text-white">
          {proposal.title}
        </h2>

        {/* Prepared for + dates */}
        <div className="mt-6 grid grid-cols-2 gap-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
              Prepared For
            </p>
            <p className="mt-1 font-medium text-gray-900 dark:text-white">
              {proposal.client.name}
            </p>
            <p className="text-sm text-gray-500">{proposal.client.email}</p>
          </div>
          <div className="text-right">
            <div className="space-y-1">
              <p className="text-sm">
                <span className="text-gray-400">Valid Until: </span>
                <span className="text-gray-700 dark:text-gray-300">
                  {formatDate(proposal.validUntil)}
                </span>
              </p>
              <p className="text-sm">
                <span className="text-gray-400">Total: </span>
                <span className="font-mono font-bold text-primary">
                  {formatCurrency(proposal.total)}
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Sections */}
        <div className="mt-8 space-y-6">
          {proposal.sections.map((section, i) => (
            <div key={section.id ?? i}>
              <h3 className="mb-2 text-lg font-semibold text-primary">
                {section.title}
              </h3>
              <div className="whitespace-pre-line text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                {section.content}
              </div>
            </div>
          ))}
        </div>

        {/* Total */}
        <div className="mt-8 rounded-lg bg-primary p-6 text-center">
          <p className="text-xs uppercase tracking-wider text-white/70">
            Project Total
          </p>
          <p className="mt-1 font-mono text-3xl font-bold text-white">
            {formatCurrency(proposal.total)}
          </p>
        </div>
      </Card>

      {/* Send Email Modal */}
      <Modal
        open={sendModal}
        onClose={() => setSendModal(false)}
        title="Send Proposal to Client"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              To
            </label>
            <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
              {proposal.client.email}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Proposal
            </label>
            <p className="mt-1 font-mono text-sm text-gray-900 dark:text-gray-100">
              {proposal.proposalNumber} &mdash; {formatCurrency(proposal.total)}
            </p>
          </div>
          <div className="space-y-1">
            <label
              htmlFor="personalMessage"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Personal Message (optional)
            </label>
            <textarea
              id="personalMessage"
              rows={3}
              value={personalMessage}
              onChange={(e) => setPersonalMessage(e.target.value)}
              placeholder="Add a personal note to the email..."
              className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-gray-600 dark:bg-slate-800 dark:text-gray-100 dark:placeholder-gray-500"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="secondary"
              onClick={() => setSendModal(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleSendEmail} loading={sending}>
              <Send className="h-4 w-4" />
              Send Proposal
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
