"use client";

import { Card } from "@/components/ui/card";

type Stat = {
  label: string;
  value: string;
  icon?: React.ReactNode;
};

type StatsCardsProps = {
  stats: Stat[];
};

export function StatsCards({ stats }: StatsCardsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.label} className="flex items-center gap-3">
          {stat.icon ? <div className="text-primary">{stat.icon}</div> : null}
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</p>
            <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stat.value}</p>
          </div>
        </Card>
      ))}
    </div>
  );
}
