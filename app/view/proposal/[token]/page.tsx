"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatDate } from "@/lib/utils";

type PublicProposal = {
  id: string;
  proposalNumber: string;
  title: string;
  status: string;
  total: number;
  validUntil: string;
  pdfUrl: string | null;
  client: { name: string; email: string };
  user: { name: string; businessName: string | null };
  sections: Array<{ id: string; title: string; content: string }>;
};

const statusColors: Record<string, "gray" | "blue" | "green" | "red" | "purple" | "amber"> = {
  DRAFT: "gray",
  SENT: "blue",
  VIEWED: "purple",
  ACCEPTED: "green",
  REJECTED: "red",
  EXPIRED: "amber",
};

export default function PublicProposalPage({ params }: { params: { token: string } }) {
  const [proposal, setProposal] = useState<PublicProposal | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadProposal() {
      try {
        const res = await fetch(`/api/public/proposals/${params.token}`);
        const json = await res.json();

        if (!res.ok) {
          throw new Error(json.error || "Failed to load proposal");
        }

        if (isMounted) setProposal(json.data);
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : "Failed to load proposal");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadProposal();

    return () => {
      isMounted = false;
    };
  }, [params.token]);

  const respond = async (action: "ACCEPTED" | "REJECTED") => {
    setActing(true);
    try {
      const res = await fetch(`/api/public/proposals/${params.token}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Failed to submit response");
      }

      setProposal((prev) => (prev ? { ...prev, status: action } : prev));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit response");
    } finally {
      setActing(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl space-y-4 p-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!proposal) {
    return (
      <div className="mx-auto max-w-2xl p-6 text-center">
        <h1 className="text-2xl font-bold text-gray-900">Proposal unavailable</h1>
        <p className="mt-2 text-sm text-gray-500">{error || "This proposal link is invalid or expired."}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <Card>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-mono text-2xl font-bold text-gray-900">{proposal.proposalNumber}</h1>
            <p className="text-sm text-gray-500">{proposal.title}</p>
            <p className="text-sm text-gray-500">From {proposal.user.businessName || proposal.user.name}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={statusColors[proposal.status] ?? "gray"}>{proposal.status}</Badge>
            {proposal.pdfUrl ? (
              <a href={proposal.pdfUrl} target="_blank" rel="noreferrer">
                <Button variant="outline">Download PDF</Button>
              </a>
            ) : null}
            {proposal.status !== "ACCEPTED" && proposal.status !== "REJECTED" && proposal.status !== "EXPIRED" ? (
              <>
                <Button onClick={() => respond("ACCEPTED")} loading={acting}>Accept</Button>
                <Button variant="outline" onClick={() => respond("REJECTED")} disabled={acting}>Reject</Button>
              </>
            ) : null}
          </div>
        </div>
      </Card>

      {error ? <p className="text-sm text-danger">{error}</p> : null}

      <Card>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <p className="text-xs uppercase tracking-wider text-gray-400">Prepared For</p>
            <p className="mt-1 text-sm font-medium text-gray-900">{proposal.client.name}</p>
            <p className="text-sm text-gray-500">{proposal.client.email}</p>
          </div>
          <div className="text-left sm:text-right">
            <p className="text-sm text-gray-500">Valid Until: {formatDate(proposal.validUntil)}</p>
            <p className="text-base font-semibold text-primary">{formatCurrency(proposal.total)}</p>
          </div>
        </div>

        <div className="mt-8 space-y-6">
          {proposal.sections.map((section) => (
            <div key={section.id}>
              <h2 className="mb-2 text-lg font-semibold text-primary">{section.title}</h2>
              <p className="whitespace-pre-line text-sm leading-relaxed text-gray-600">{section.content}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
