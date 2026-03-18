"use client";

import { useQuery } from "@tanstack/react-query";

export interface DashboardInvoice {
  id: string;
  invoiceNumber: string;
  status: string;
  total: number;
  dueDate: string;
  createdAt: string;
  client: {
    name: string;
  };
}

export interface DashboardProposal {
  id: string;
  proposalNumber: string;
  title: string;
  status: string;
  total: number;
  validUntil: string;
  createdAt: string;
  client: {
    name: string;
  };
}

export interface DashboardMonth {
  month: string;
  revenue: number;
}

export interface DashboardData {
  totalRevenue: number;
  outstandingAmount: number;
  totalInvoices: number;
  totalClients: number;
  currency: string;
  monthlyRevenue: DashboardMonth[];
  recentInvoices: DashboardInvoice[];
  recentProposals: DashboardProposal[];
}

interface DashboardResponse {
  data: DashboardData;
}

async function fetchDashboard(): Promise<DashboardData> {
  const res = await fetch("/api/dashboard");
  if (!res.ok) throw new Error("Failed to fetch dashboard data");

  const json = (await res.json()) as DashboardResponse;
  return json.data;
}

export function useDashboard() {
  return useQuery({
    queryKey: ["dashboard"],
    queryFn: fetchDashboard,
  });
}
