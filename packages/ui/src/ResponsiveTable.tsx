import type { ReactNode } from "react";
import { EmptyState } from "./EmptyState";

export interface TableColumn<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
}

interface ResponsiveTableProps<T> {
  columns: TableColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  mobileCard: (row: T) => ReactNode;
  emptyTitle?: string;
  emptyDescription?: string;
}

export function ResponsiveTable<T>({
  columns,
  rows,
  rowKey,
  mobileCard,
  emptyTitle = "Nenhum dado encontrado",
  emptyDescription = "Ajuste os filtros ou tente novamente."
}: ResponsiveTableProps<T>) {
  if (rows.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <div className="space-y-3">
      <div className="space-y-3 md:hidden">
        {rows.map((row) => (
          <div key={rowKey(row)}>{mobileCard(row)}</div>
        ))}
      </div>

      <div className="hidden overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm md:block">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className="px-4 py-3 text-left uppercase tracking-wider text-slate-600"
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={rowKey(row)} className="border-t border-slate-100">
                {columns.map((column) => (
                  <td key={column.key} className="px-4 py-3">
                    {column.render(row)}
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

