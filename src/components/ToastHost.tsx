import { useEffect, useState } from "react";
import Toast from "./Toast";
import { toastBus, type ToastEvent } from "../utils/toastBus";

const ToastHost = () => {
  const [toast, setToast] = useState<(ToastEvent & { key: number }) | null>(
    null,
  );

  useEffect(() => {
    return toastBus.subscribe((event) => {
      setToast({ ...event, key: Date.now() });
    });
  }, []);

  if (!toast) return null;

  return (
    <Toast
      key={toast.key}
      type={toast.kind}
      message={toast.message}
      onClose={() => setToast(null)}
    />
  );
};

export default ToastHost;

