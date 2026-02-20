import { motion } from "framer-motion";
import React, { useEffect } from "react";
import { IoWarningOutline } from "react-icons/io5";
import type { ToastProps } from "../types/toast.types";

const Toast: React.FC<ToastProps> = ({ message, type = "error", onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

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
        rounded-lg
        shadow-lg
        text-sm font-medium
        ${
          type === "error"
            ? "bg-red-600 text-white"
            : "bg-emerald-600 text-white"
        }
      `}
      style={{ zIndex: 9999 }}
    >
      {type === "error" && <IoWarningOutline className="w-5 h-5 opacity-90" />}
      <span>{message}</span>
    </motion.div>
  );
};

export default Toast;
