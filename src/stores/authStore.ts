import { create } from "zustand";
import { persist } from "zustand/middleware";

interface Doctor {
  id: number;
  email: string;
  clinicCode: string;
}

interface AuthState {
  token: string | null;
  doctor: Doctor | null;
  isAuthenticated: boolean;
  login: (token: string, doctor: Doctor) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      doctor: null,
      isAuthenticated: false,
      login: (token: string, doctor: Doctor) =>
        set({ token, doctor, isAuthenticated: true }),
      logout: () =>
        set({ token: null, doctor: null, isAuthenticated: false }),
    }),
    {
      name: "sokrates-auth",
    }
  )
);
