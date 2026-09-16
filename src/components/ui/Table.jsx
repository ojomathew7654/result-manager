import clsx from "clsx";

/**
 * Generic, config-driven table used across every list/grid screen in the app.
 *
 * columns: [{ key, header, align, width, render(row, index) }]
 * rows:    [{ id, ...fields }]
 */
export default function Table({ columns, rows, rowKey = "id", emptyLabel = "Nothing to show yet.", dense }) {
  if (!rows || rows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-ink-200 py-14 text-center">
        <p className="text-sm font-medium text-ink-500">{emptyLabel}</p>
      </div>
    );
  }

  return (
    <div className="scroll-thin-light overflow-x-auto rounded-xl border border-ink-100">
      <table className="w-full min-w-[640px] border-collapse text-left text-sm">
        <thead>
          <tr className="bg-ink-50/70">
            {columns.map((col) => (
              <th
                key={col.key}
                style={{ width: col.width }}
                className={clsx(
                  "whitespace-nowrap border-b border-ink-100 px-4 font-medium text-ink-500",
                  dense ? "py-2.5" : "py-3.5",
                  col.align === "right" && "text-right",
                  col.align === "center" && "text-center"
                )}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr
              key={row[rowKey] ?? index}
              className="border-b border-ink-50 last:border-0 even:bg-ink-50/30 hover:bg-brand-50/40 transition-colors"
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={clsx(
                    "px-4 align-middle text-ink-700",
                    dense ? "py-2" : "py-3",
                    col.align === "right" && "text-right",
                    col.align === "center" && "text-center"
                  )}
                >
                  {col.render ? col.render(row, index) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
