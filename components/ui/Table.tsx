"use client";

import { cn } from "@/lib/utils";

interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => React.ReactNode;
  className?: string;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  onRowClick?: (item: T) => void;
  className?: string;
}

export default function Table<T>({
  columns,
  data,
  onRowClick,
  className,
}: TableProps<T>) {
  return (
    <div className={cn("w-full overflow-x-auto [-webkit-overflow-scrolling:touch]", className)}>
      <table className="w-full min-w-[640px]">
        <thead>
          <tr className="border-b border-glass-border">
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn(
                  "text-left text-xs font-medium text-text-muted uppercase tracking-wider px-4 py-3",
                  col.className
                )}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((item, idx) => (
            <tr
              key={idx}
              onClick={() => onRowClick?.(item)}
              className={cn(
                "border-b border-glass-border/50 transition-all duration-300",
                "hover:bg-glass-hover",
                onRowClick && "cursor-pointer"
              )}
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={cn(
                    "px-4 py-3.5 text-sm text-text-secondary",
                    col.className
                  )}
                >
                  {col.render
                    ? col.render(item)
                    : ((item as Record<string, unknown>)[col.key] as React.ReactNode)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
