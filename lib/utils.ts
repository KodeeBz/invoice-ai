import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function formatCurrency(amount: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount);
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(date));
}

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function generateNumber(
  prefix: string,
  existingNumbers: string[]
): string {
  const year = new Date().getFullYear();
  const yearPrefix = `${prefix}-${year}-`;

  const currentYearNumbers = existingNumbers
    .filter((n) => n.startsWith(yearPrefix))
    .map((n) => parseInt(n.replace(yearPrefix, ""), 10))
    .filter((n) => !isNaN(n));

  const nextNumber =
    currentYearNumbers.length > 0 ? Math.max(...currentYearNumbers) + 1 : 1;

  return `${yearPrefix}${String(nextNumber).padStart(3, "0")}`;
}
