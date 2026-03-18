"use client";

import { Card } from "@/components/ui/card";

type ActivityItem = {
  id: string;
  title: string;
  subtitle?: string;
};

type RecentActivityProps = {
  title: string;
  items: ActivityItem[];
};

export function RecentActivity({ title, items }: RecentActivityProps) {
  return (
    <Card>
      <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">{title}</h2>
      {items.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">No recent activity</p>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => (
            <li key={item.id} className="rounded-lg border border-gray-200 px-3 py-2 dark:border-slate-700">
              <p className="text-sm font-medium text-gray-900 dark:text-white">{item.title}</p>
              {item.subtitle ? (
                <p className="text-xs text-gray-500 dark:text-gray-400">{item.subtitle}</p>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
