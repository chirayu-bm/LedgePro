import {
  LayoutDashboard,
  ArrowLeftRight,
  FileText,
  BarChart3,
  TrendingUp,
  Settings,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export const navItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Transactions", href: "/transactions", icon: ArrowLeftRight },
  { label: "Invoices", href: "/invoices", icon: FileText },
  { label: "Reports", href: "/reports", icon: BarChart3 },
  { label: "Analytics", href: "/analytics", icon: TrendingUp },
  { label: "Settings", href: "/settings", icon: Settings },
];

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: "credit" | "debit";
  status: "completed" | "pending" | "failed";
  date: string;
  category: string;
}

export const mockTransactions: Transaction[] = [
  { id: "TXN001", description: "Client Payment - Acme Corp", amount: 12500, type: "credit", status: "completed", date: "2026-03-18", category: "Revenue" },
  { id: "TXN002", description: "Office Supplies", amount: 340, type: "debit", status: "completed", date: "2026-03-17", category: "Expenses" },
  { id: "TXN003", description: "Software Subscription", amount: 99, type: "debit", status: "pending", date: "2026-03-17", category: "Software" },
  { id: "TXN004", description: "Consulting Fee - Beta Inc", amount: 8750, type: "credit", status: "completed", date: "2026-03-16", category: "Revenue" },
  { id: "TXN005", description: "Cloud Hosting", amount: 450, type: "debit", status: "completed", date: "2026-03-16", category: "Infrastructure" },
  { id: "TXN006", description: "Freelance Payment", amount: 3200, type: "debit", status: "failed", date: "2026-03-15", category: "Payroll" },
  { id: "TXN007", description: "Product Sale - Delta LLC", amount: 15800, type: "credit", status: "completed", date: "2026-03-15", category: "Revenue" },
  { id: "TXN008", description: "Marketing Campaign", amount: 2100, type: "debit", status: "pending", date: "2026-03-14", category: "Marketing" },
];

export const revenueData = [
  { month: "Jan", revenue: 42000, expenses: 28000 },
  { month: "Feb", revenue: 48000, expenses: 31000 },
  { month: "Mar", revenue: 55000, expenses: 29000 },
  { month: "Apr", revenue: 51000, expenses: 33000 },
  { month: "May", revenue: 62000, expenses: 35000 },
  { month: "Jun", revenue: 58000, expenses: 30000 },
  { month: "Jul", revenue: 67000, expenses: 38000 },
  { month: "Aug", revenue: 72000, expenses: 36000 },
  { month: "Sep", revenue: 69000, expenses: 34000 },
  { month: "Oct", revenue: 78000, expenses: 40000 },
  { month: "Nov", revenue: 82000, expenses: 42000 },
  { month: "Dec", revenue: 91000, expenses: 45000 },
];

export const expenseCategories = [
  { category: "Payroll", amount: 45000, fill: "#FF7A00" },
  { category: "Infrastructure", amount: 12000, fill: "#FF9A40" },
  { category: "Marketing", amount: 8500, fill: "#FFB980" },
  { category: "Software", amount: 6200, fill: "#22C55E" },
  { category: "Office", amount: 4800, fill: "#4ADE80" },
  { category: "Other", amount: 3500, fill: "rgba(255,255,255,0.2)" },
];

export interface Invoice {
  [key: string]: string | number;
  id: string;
  client: string;
  amount: number;
  status: "paid" | "pending" | "overdue";
  dueDate: string;
  issuedDate: string;
}

export const mockInvoices: Invoice[] = [
  { id: "INV-001", client: "Acme Corp", amount: 12500, status: "paid", dueDate: "2026-03-20", issuedDate: "2026-02-20" },
  { id: "INV-002", client: "Beta Inc", amount: 8750, status: "pending", dueDate: "2026-03-25", issuedDate: "2026-02-25" },
  { id: "INV-003", client: "Delta LLC", amount: 15800, status: "overdue", dueDate: "2026-03-10", issuedDate: "2026-02-10" },
  { id: "INV-004", client: "Gamma Solutions", amount: 5400, status: "paid", dueDate: "2026-03-15", issuedDate: "2026-02-15" },
  { id: "INV-005", client: "Omega Tech", amount: 22000, status: "pending", dueDate: "2026-03-30", issuedDate: "2026-03-01" },
  { id: "INV-006", client: "Zeta Digital", amount: 9800, status: "paid", dueDate: "2026-03-12", issuedDate: "2026-02-12" },
];
