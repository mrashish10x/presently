import { cn } from "@/lib/utils";

export interface Column<T> {
  header: string;
  accessor: (row: T) => React.ReactNode;
  className?: string;
  headerClassName?: string;
}

export function DataTable<T>({
  columns,
  rows,
  keyField,
  emptyState,
}: {
  columns: Column<T>[];
  rows: T[];
  keyField: (row: T) => string;
  emptyState?: React.ReactNode;
}) {
  if (rows.length === 0 && emptyState) {
    return <div className="rounded-2xl border border-line bg-white">{emptyState}</div>;
  }

  return (
    <div className="rounded-2xl border border-line bg-white overflow-hidden">
      <div className="overflow-x-auto scroll-thin">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-line bg-sand-50">
              {columns.map((col, i) => (
                <th
                  key={i}
                  className={cn(
                    "px-4 py-3 text-xs font-medium uppercase tracking-wide text-ink-soft/60 whitespace-nowrap",
                    col.headerClassName
                  )}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={keyField(row)}
                className="border-b border-line last:border-0 hover:bg-sand-50/70 transition-colors"
              >
                {columns.map((col, i) => (
                  <td key={i} className={cn("px-4 py-3.5 align-middle", col.className)}>
                    {col.accessor(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
