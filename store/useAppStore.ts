import { create } from "zustand";

type AppState = {
  mobileNavOpen: boolean;
  setMobileNavOpen: (open: boolean) => void;
};

export const useAppStore = create<AppState>((set) => ({
  mobileNavOpen: false,
  setMobileNavOpen: (open) => set({ mobileNavOpen: open }),
}));
