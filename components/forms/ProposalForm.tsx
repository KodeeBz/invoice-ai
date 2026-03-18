"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { Plus, Search, Sparkles, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { Skeleton } from "@/components/ui/skeleton";
import { ClientForm } from "@/components/forms/ClientForm";
import { SectionEditor, SectionData } from "@/components/forms/SectionEditor";
import { useClients, useCreateClient } from "@/hooks/useClients";
import { useCreateProposal, useUpdateProposal, ProposalInput } from "@/hooks/useProposals";
import { useAIGenerateProposal } from "@/hooks/useAIGenerate";

const projectTypes = [
  "Web Development",
  "Mobile App",
  "Graphic Design",
  "Content Writing",
  "Consulting",
  "Video Editing",
  "SEO/Marketing",
  "Other",
];

interface ProposalFormData {
  clientId: string;
  proposalNumber: string;
  title: string;
  validUntil: string;
  total: number;
}

interface ProposalFormProps {
  mode: "create" | "edit";
  proposalId?: string;
  defaultValues?: Partial<ProposalFormData> & {
    sections?: SectionData[];
    aiGenerated?: boolean;
  };
}

export function ProposalForm({ mode, proposalId, defaultValues }: ProposalFormProps) {
  const router = useRouter();
  const [clientModal, setClientModal] = useState(false);
  const [clientSearch, setClientSearch] = useState("");
  const [clientDropdownOpen, setClientDropdownOpen] = useState(false);
  const [sections, setSections] = useState<SectionData[]>(
    defaultValues?.sections ?? [
      { id: `section-${Date.now()}`, title: "", content: "" },
    ]
  );
  const [saving, setSaving] = useState(false);
  const [aiGenerated, setAiGenerated] = useState(defaultValues?.aiGenerated ?? false);

  // AI panel state
  const [aiExpanded, setAiExpanded] = useState(true);
  const [aiDescription, setAiDescription] = useState("");
  const [aiProjectType, setAiProjectType] = useState("Web Development");
  const [aiTimeline, setAiTimeline] = useState("");
  const [aiBudget, setAiBudget] = useState("");
  const [aiExperience, setAiExperience] = useState("");

  const { data: clients } = useClients();
  const createClient = useCreateClient();
  const createProposal = useCreateProposal();
  const updateProposal = useUpdateProposal();
  const aiGenerate = useAIGenerateProposal();

  const in30Days = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  const autoProposalNumber = useMemo(
    () => defaultValues?.proposalNumber ?? "",
    [defaultValues?.proposalNumber]
  );

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ProposalFormData>({
    defaultValues: {
      clientId: defaultValues?.clientId ?? "",
      proposalNumber: defaultValues?.proposalNumber ?? autoProposalNumber,
      title: defaultValues?.title ?? "",
      validUntil: defaultValues?.validUntil
        ? new Date(defaultValues.validUntil).toISOString().split("T")[0]
        : in30Days,
      total: defaultValues?.total ?? 0,
    },
  });

  const clientId = watch("clientId");
  const selectedClient = clients?.find((c) => c.id === clientId);
  const filteredClients = clients?.filter(
    (c) =>
      c.name.toLowerCase().includes(clientSearch.toLowerCase()) ||
      c.email.toLowerCase().includes(clientSearch.toLowerCase())
  );

  useEffect(() => {
    if (!defaultValues?.proposalNumber && autoProposalNumber) {
      setValue("proposalNumber", autoProposalNumber);
    }
  }, [autoProposalNumber, defaultValues?.proposalNumber, setValue]);

  useEffect(() => {
    if (mode !== "create" || defaultValues?.proposalNumber) return;

    let isMounted = true;

    async function fetchNextNumber() {
      try {
        const res = await fetch("/api/proposals/next-number");
        const json = await res.json();
        if (!res.ok) return;
        if (isMounted) setValue("proposalNumber", json.data.nextNumber);
      } catch {
        // Fall back to manual override if request fails.
      }
    }

    fetchNextNumber();

    return () => {
      isMounted = false;
    };
  }, [mode, defaultValues?.proposalNumber, setValue]);

  useEffect(() => {
    if (mode !== "create") return;

    let isMounted = true;

    async function fetchDefaults() {
      try {
        const res = await fetch("/api/user/settings");
        const json = await res.json();
        if (!res.ok || !isMounted) return;
        setAiExperience(json.data.aiContext ?? "");
      } catch {
        // Continue with manual AI context input.
      }
    }

    fetchDefaults();

    return () => {
      isMounted = false;
    };
  }, [mode]);

  const handleAIGenerate = () => {
    if (!aiDescription.trim()) return;

    aiGenerate.mutate(
      {
        clientName: selectedClient?.name || "Client",
        projectTitle: watch("title") || "Project Proposal",
        projectDescription: aiDescription,
        timeline: aiTimeline || "4-6 weeks",
        budget: aiBudget ? parseFloat(aiBudget) : null,
        projectType: aiProjectType,
        yourExperience: aiExperience || undefined,
      },
      {
        onSuccess: (data) => {
          const newSections: SectionData[] = data.sections.map((s, i) => ({
            id: `ai-${Date.now()}-${i}`,
            title: s.title,
            content: s.content,
          }));
          setSections(newSections);
          setAiGenerated(true);
          if (data.title) setValue("title", data.title);
          if (data.total) setValue("total", data.total);
        },
      }
    );
  };

  const onSubmit = async (data: ProposalFormData, status: string) => {
    if (sections.length === 0 || sections.every((s) => !s.title && !s.content)) {
      return;
    }

    setSaving(true);
    try {
      const payload: ProposalInput = {
        clientId: data.clientId,
        proposalNumber: data.proposalNumber,
        title: data.title,
        validUntil: new Date(data.validUntil).toISOString(),
        sections: sections.map((section, index) => ({
          title: section.title,
          content: section.content,
          order: index,
        })),
        total: data.total,
        status,
        aiGenerated,
      };

      let savedId = proposalId;
      if (mode === "edit" && proposalId) {
        await updateProposal.mutateAsync({ id: proposalId, data: payload });
      } else {
        const created = await createProposal.mutateAsync(payload);
        savedId = created.id;
      }

      if (status === "GENERATE_PDF" && savedId) {
        try {
          const res = await fetch(`/api/proposals/${savedId}/pdf`, {
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
        router.push(`/proposals/${savedId}`);
      } else {
        router.push("/proposals");
      }
    } catch {
      // Error handled by mutation
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="space-y-6">
      {/* AI Generate Panel */}
      {mode === "create" && (
        <Card className="border-primary/20 bg-primary/5 dark:bg-primary/10">
          <button
            type="button"
            className="flex w-full items-center justify-between"
            onClick={() => setAiExpanded(!aiExpanded)}
          >
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                Generate with AI
              </span>
            </div>
            {aiExpanded ? (
              <ChevronUp className="h-4 w-4 text-gray-400" />
            ) : (
              <ChevronDown className="h-4 w-4 text-gray-400" />
            )}
          </button>

          {aiExpanded && (
            <div className="mt-4 space-y-4">
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Project Description
                </label>
                <textarea
                  rows={3}
                  value={aiDescription}
                  onChange={(e) => setAiDescription(e.target.value)}
                  placeholder="e.g., Complete brand redesign including logo, website, and social media templates for a tech startup"
                  className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-gray-600 dark:bg-slate-800 dark:text-gray-100 dark:placeholder-gray-500"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Project Type
                  </label>
                  <select
                    value={aiProjectType}
                    onChange={(e) => setAiProjectType(e.target.value)}
                    className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-gray-600 dark:bg-slate-800 dark:text-gray-100"
                  >
                    {projectTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Timeline
                  </label>
                  <input
                    type="text"
                    value={aiTimeline}
                    onChange={(e) => setAiTimeline(e.target.value)}
                    placeholder="e.g., 4-6 weeks"
                    className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-gray-600 dark:bg-slate-800 dark:text-gray-100 dark:placeholder-gray-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Budget (optional)
                  </label>
                  <input
                    type="number"
                    value={aiBudget}
                    onChange={(e) => setAiBudget(e.target.value)}
                    placeholder="e.g., 5000"
                    min="0"
                    className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-gray-600 dark:bg-slate-800 dark:text-gray-100 dark:placeholder-gray-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Your Experience (optional)
                  </label>
                  <input
                    type="text"
                    value={aiExperience}
                    onChange={(e) => setAiExperience(e.target.value)}
                    placeholder="e.g., 5 years in web development"
                    className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-gray-600 dark:bg-slate-800 dark:text-gray-100 dark:placeholder-gray-500"
                  />
                </div>
              </div>

              <Button
                type="button"
                onClick={handleAIGenerate}
                loading={aiGenerate.isPending}
                disabled={!aiDescription.trim()}
              >
                <Sparkles className="h-4 w-4" />
                Generate Proposal Sections
              </Button>

              {aiGenerate.isPending && (
                <div className="space-y-3 rounded-lg border border-gray-200 p-4 dark:border-slate-700">
                  <p className="text-xs text-gray-400">Generating proposal sections...</p>
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="space-y-2">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-16 w-full" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </Card>
      )}

      {/* Client Selection */}
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

      {/* Proposal Details */}
      <Card>
        <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
          Proposal Details
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            id="proposalNumber"
            label="Proposal Number"
            {...register("proposalNumber", { required: "Proposal number is required" })}
            error={errors.proposalNumber?.message}
          />
          <Input
            id="validUntil"
            label="Valid Until"
            type="date"
            {...register("validUntil", { required: "Valid until date is required" })}
            error={errors.validUntil?.message}
          />
        </div>
        <div className="mt-4">
          <Input
            id="title"
            label="Proposal Title"
            {...register("title", { required: "Title is required" })}
            error={errors.title?.message}
            placeholder="e.g., Website Redesign Proposal for Acme Corp"
          />
        </div>
        <div className="mt-4">
          <Input
            id="total"
            label="Total Price"
            type="number"
            min="0"
            step="0.01"
            {...register("total", { required: "Total is required", valueAsNumber: true })}
            error={errors.total?.message}
          />
        </div>
      </Card>

      {/* Sections */}
      <Card>
        <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
          Proposal Sections
        </h2>
        <SectionEditor sections={sections} onChange={setSections} />
      </Card>

      {/* Actions */}
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
