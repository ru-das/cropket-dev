// Class-name helper used by every shadcn/ui component: merges Tailwind
// classes and lets later classes override earlier ones (e.g. conditional styles).
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
