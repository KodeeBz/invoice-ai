import { NextResponse } from "next/server";
import { getAuthSession, unauthorized, serverError } from "@/lib/session";
import { getDashboardOverview } from "@/lib/dashboard";
import { markOverdueInvoices } from "@/lib/lifecycle";

export async function GET() {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) return unauthorized();

    const userId = session.user.id;
    const newlyOverdueCount = await markOverdueInvoices(userId);
    const overview = await getDashboardOverview(userId);

    return NextResponse.json({
      data: {
        totalRevenue: overview.totalRevenue,
        outstandingAmount: overview.outstandingAmount,
        totalInvoices: overview.totalInvoices,
        totalClients: overview.totalClients,
        currency: overview.currency,
        newlyOverdueCount,
      },
    });
  } catch (error) {
    return serverError(error);
  }
}
