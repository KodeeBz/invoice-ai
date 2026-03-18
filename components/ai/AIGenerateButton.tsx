"use client";

import { useState } from "react";
import { Sparkles, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAIGenerateInvoice } from "@/hooks/useAIGenerate";
import { LineItemData } from "@/components/forms/LineItemEditor";

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

interface AIGeneratePanelProps {
  clientName: string;
  onGenerated: (data: {
    lineItems: LineItemData[];
    notes: string;
    suggestedDueDate: number;
  }) => void;
}

export function AIGeneratePanel({
  clientName,
  onGenerated,
}: AIGeneratePanelProps) {
  const [expanded, setExpanded] = useState(true);
  const [projectDescription, setProjectDescription] = useState("");
  const [projectType, setProjectType] = useState("Web Development");
  const [pricingType, setPricingType] = useState<"hourly" | "fixed">("hourly");
  const [hourlyRate, setHourlyRate] = useState<string>("");
  const [fixedPrice, setFixedPrice] = useState<string>("");

  const aiGenerate = useAIGenerateInvoice();

  const handleGenerate = () => {
    if (!projectDescription.trim()) return;

    aiGenerate.mutate(
      {
        clientName: clientName || "Client",
        projectDescription,
        projectType,
        hourlyRate: pricingType === "hourly" && hourlyRate ? parseFloat(hourlyRate) : null,
        fixedPrice: pricingType === "fixed" && fixedPrice ? parseFloat(fixedPrice) : null,
      },
      {
        onSuccess: (data) => {
          const lineItems: LineItemData[] = data.lineItems.map((item, i) => ({
            id: `ai-${Date.now()}-${i}`,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            total: item.quantity * item.unitPrice,
            aiGenerated: true,
          }));

          onGenerated({
            lineItems,
            notes: data.notes,
            suggestedDueDate: data.suggestedDueDate,
          });
        },
      }
    );
  };

  return (
    <Card className="border-primary/20 bg-primary/5 dark:bg-primary/10">
      <button
        type="button"
        className="flex w-full items-center justify-between"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <span className="text-sm font-semibold text-gray-900 dark:text-white">
            Generate with AI
          </span>
        </div>
        {expanded ? (
          <ChevronUp className="h-4 w-4 text-gray-400" />
        ) : (
          <ChevronDown className="h-4 w-4 text-gray-400" />
        )}
      </button>

      {expanded && (
        <div className="mt-4 space-y-4">
          {/* Project Description */}
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Project Description
            </label>
            <textarea
              rows={3}
              value={projectDescription}
              onChange={(e) => setProjectDescription(e.target.value)}
              placeholder="e.g., 3-page website redesign for a restaurant with online menu and reservation system"
              className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-gray-600 dark:bg-slate-800 dark:text-gray-100 dark:placeholder-gray-500"
            />
          </div>

          {/* Project Type */}
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Project Type
            </label>
            <select
              value={projectType}
              onChange={(e) => setProjectType(e.target.value)}
              className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-gray-600 dark:bg-slate-800 dark:text-gray-100"
            >
              {projectTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          {/* Pricing Type */}
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Pricing Type
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                <input
                  type="radio"
                  name="pricingType"
                  value="hourly"
                  checked={pricingType === "hourly"}
                  onChange={() => setPricingType("hourly")}
                  className="text-primary focus:ring-primary"
                />
                Hourly
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                <input
                  type="radio"
                  name="pricingType"
                  value="fixed"
                  checked={pricingType === "fixed"}
                  onChange={() => setPricingType("fixed")}
                  className="text-primary focus:ring-primary"
                />
                Fixed Price
              </label>
            </div>
          </div>

          {/* Rate/Price input */}
          {pricingType === "hourly" ? (
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Hourly Rate (optional)
              </label>
              <input
                type="number"
                value={hourlyRate}
                onChange={(e) => setHourlyRate(e.target.value)}
                placeholder="e.g., 50"
                min="0"
                className="block w-full max-w-xs rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-gray-600 dark:bg-slate-800 dark:text-gray-100 dark:placeholder-gray-500"
              />
            </div>
          ) : (
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Fixed Price Budget (optional)
              </label>
              <input
                type="number"
                value={fixedPrice}
                onChange={(e) => setFixedPrice(e.target.value)}
                placeholder="e.g., 2000"
                min="0"
                className="block w-full max-w-xs rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-gray-600 dark:bg-slate-800 dark:text-gray-100 dark:placeholder-gray-500"
              />
            </div>
          )}

          {/* Generate Button */}
          <Button
            type="button"
            onClick={handleGenerate}
            loading={aiGenerate.isPending}
            disabled={!projectDescription.trim()}
          >
            <Sparkles className="h-4 w-4" />
            Generate Line Items
          </Button>

          {/* Loading skeleton for line items */}
          {aiGenerate.isPending && (
            <div className="space-y-3 rounded-lg border border-gray-200 p-4 dark:border-slate-700">
              <p className="text-xs text-gray-400">Generating line items...</p>
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-4 flex-1" />
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-20" />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
