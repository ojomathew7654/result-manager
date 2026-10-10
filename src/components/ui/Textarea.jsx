import clsx from "clsx";

export default function Textarea({ className, rows = 3, ...props }) {
  return (
    <textarea
      rows={rows}
      className={clsx(
        "w-full rounded-lg border border-ink-200 bg-white px-3.5 py-2.5 text-sm text-ink-900 placeholder:text-ink-300 transition-colors",
        "focus:border-brand-500 focus:ring-2 focus:ring-brand-100",
        className
      )}
      {...props}
    />
  );
}
