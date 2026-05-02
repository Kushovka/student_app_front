export type ToastKind = "error" | "access";

export interface ToastEvent {
  kind: ToastKind;
  message: string;
}

type Listener = (event: ToastEvent) => void;

const listeners = new Set<Listener>();

export const toastBus = {
  subscribe(listener: Listener) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
  emit(event: ToastEvent) {
    listeners.forEach((listener) => listener(event));
  },
  error(message: string) {
    this.emit({ kind: "error", message });
  },
  success(message: string) {
    this.emit({ kind: "access", message });
  },
};
