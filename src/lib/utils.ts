
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Add the getBadgeImageForLevel function
export function getBadgeImageForLevel(level: number): string {
  switch (level) {
    case 1:
      return '/badges/level-1.svg';
    case 2:
      return '/badges/level-2.svg';
    case 3:
      return '/badges/level-3.svg';
    case 4:
      return '/badges/level-4.svg';
    case 5:
      return '/badges/level-5.svg';
    default:
      return '/badges/level-1.svg';
  }
}
