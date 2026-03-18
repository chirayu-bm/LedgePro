import { create } from "zustand";
import { type Transaction, mockTransactions } from "./constants";

interface AppState {
  // Sidebar
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;

  // Transactions
  transactions: Transaction[];
  isLoading: boolean;
  error: string | null;
  addTransaction: (tx: Transaction) => void;
  setTransactions: (txs: Transaction[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // User
  user: {
    name: string;
    email: string;
    role: "admin" | "accountant" | "viewer";
    avatar?: string;
  } | null;
  setUser: (user: AppState["user"]) => void;
}

export const useAppStore = create<AppState>((set) => ({
  // Sidebar
  sidebarCollapsed: false,
  toggleSidebar: () =>
    set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

  // Transactions
  transactions: mockTransactions,
  isLoading: false,
  error: null,
  addTransaction: (tx) =>
    set((state) => ({ transactions: [tx, ...state.transactions] })),
  setTransactions: (transactions) => set({ transactions }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),

  // User
  user: {
    name: "Alex Morgan",
    email: "alex@ledgerflow.io",
    role: "admin",
  },
  setUser: (user) => set({ user }),
}));
