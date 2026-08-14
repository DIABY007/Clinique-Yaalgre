import { toast } from "sonner";

type ToastVariant = "success" | "error" | "info" | "warning";

const variants: Record<ToastVariant, { duration: number }> = {
  success: { duration: 3000 },
  error: { duration: 5000 },
  info: { duration: 3000 },
  warning: { duration: 4000 },
};

export function showToast(
  message: string,
  variant: ToastVariant = "info",
  description?: string
) {
  const { duration } = variants[variant];

  switch (variant) {
    case "success":
      toast.success(message, { description, duration });
      break;
    case "error":
      toast.error(message, { description, duration });
      break;
    case "warning":
      toast.warning(message, { description, duration });
      break;
    default:
      toast(message, { description, duration });
      break;
  }
}