
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Utility function for getting badge image based on level
export const getBadgeImageForLevel = (level: number) => {
  // Simple implementation - can be expanded with actual badge images
  return `/badges/level-${level}.svg`;
};
