import { HTMLAttributes, TableHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type TableProps = TableHTMLAttributes<HTMLTableElement>;
type TableSectionProps = HTMLAttributes<HTMLTableSectionElement>;
type TableRowProps = HTMLAttributes<HTMLTableRowElement>;
type TableCellProps = HTMLAttributes<HTMLTableCellElement>;

export function Table({ className, ...props }: TableProps) {
  return (
    <div className="w-full overflow-x-auto">
      <table className={cn("w-full text-left text-sm", className)} {...props} />
    </div>
  );
}

export function TableHead({ className, ...props }: TableSectionProps) {
  return (
    <thead
      className={cn(
        "border-b border-gray-200 bg-gray-50 dark:border-slate-700 dark:bg-slate-800/50",
        className
      )}
      {...props}
    />
  );
}

export function TableBody({ className, ...props }: TableSectionProps) {
  return (
    <tbody
      className={cn("divide-y divide-gray-200 dark:divide-slate-700", className)}
      {...props}
    />
  );
}

export function TableRow({ className, ...props }: TableRowProps) {
  return (
    <tr
      className={cn("hover:bg-gray-50 dark:hover:bg-slate-800/50", className)}
      {...props}
    />
  );
}

export function TableHeaderCell({ className, ...props }: TableCellProps) {
  return (
    <th
      className={cn("px-4 py-3 font-medium text-gray-500 dark:text-gray-400", className)}
      {...props}
    />
  );
}

export function TableCell({ className, ...props }: TableCellProps) {
  return <td className={cn("px-4 py-3", className)} {...props} />;
}
