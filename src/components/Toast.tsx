import { motion } from "framer-motion";
import React, { useEffect } from "react";
import { IoCheckmarkCircleOutline, IoWarningOutline } from "react-icons/io5";
import type { ToastProps } from "../types/toast.types";

const Toast: React.FC<ToastProps> = ({ message, type = "error", onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -25, x: "-50%" }}
      animate={{ opacity: 1, y: -10, x: "-50%" }}
      exit={{ opacity: 0, y: -25, x: "-50%" }}
      transition={{ duration: 0.2 }}
      className={`
        fixed top-6 left-1/2 -translate-x-1/2
        flex items-center gap-3
        px-5 py-3
        rounded-xl
        border
        shadow-xl shadow-zinc-950/10
        text-sm font-medium
        ${
          type === "error"
            ? "border-red-200 bg-red-50 text-red-700"
            : "border-emerald-200 bg-emerald-50 text-emerald-700"
        }
      `}
      style={{ zIndex: 9999 }}
    >
      {type === "error" && <IoWarningOutline className="w-5 h-5 opacity-90" />}
      {type !== "error" && (
        <IoCheckmarkCircleOutline className="h-5 w-5 opacity-90" />
      )}
      <span>{message}</span>
    </motion.div>
  );
};

export default Toast;
