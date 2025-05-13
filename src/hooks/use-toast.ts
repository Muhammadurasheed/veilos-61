
// Reexport the toast components from shadcn/ui
import { useToast as useShadcnToast } from "@/components/ui/toast";

// Re-export the useToast hook
export const useToast = useShadcnToast;

// Export a standalone toast function for use outside of React components
export const toast = useShadcnToast().toast;

