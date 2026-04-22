import { createContext, useContext } from "react";
import type { AuthUser } from "../api/auth";

export interface AuthContextValue {
  user: AuthUser | null;
  isUserLoading: boolean;
  refreshMe: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider = AuthContext.Provider;

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
};
