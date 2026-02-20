export type ToastType = "error" | "access";

export interface ToastProps {
  message: string;
  type?: ToastType;
  onClose: () => void;
}
