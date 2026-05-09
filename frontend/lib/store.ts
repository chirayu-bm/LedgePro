import { create } from "zustand";
import type { LedgerTransaction } from "./api-client";
import type { AppRole } from "./contracts";

interface AppState {
  // Sidebar
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;

  // Transactions
  transactions: LedgerTransaction[];
  isLoading: boolean;
  error: string | null;
  addTransaction: (tx: LedgerTransaction) => void;
  setTransactions: (txs: LedgerTransaction[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  transactionSearchQuery: string;
  setTransactionSearchQuery: (query: string) => void;

  // User
  user: {
    id?: string;
    name: string;
    email: string;
    role: AppRole;
    avatar?: string;
  } | null;
  setUser: (user: AppState["user"]) => void;
  setUserRole: (role: AppRole) => void;
}

export const useAppStore = create<AppState>((set) => ({
  // Sidebar
  sidebarCollapsed: false,
  toggleSidebar: () =>
    set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

  // Transactions
  transactions: [],
  isLoading: false,
  error: null,
  addTransaction: (tx) =>
    set((state) => ({ transactions: [tx, ...state.transactions] })),
  setTransactions: (transactions) => set({ transactions }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  transactionSearchQuery: "",
  setTransactionSearchQuery: (transactionSearchQuery) => set({ transactionSearchQuery }),

  // User
  user: null,
  setUser: (user) => set({ user }),
  setUserRole: (role) =>
    set((state) => {
      if (!state.user) return state;
      return {
        user: {
          ...state.user,
          role
        }
      };
    }),
}));
