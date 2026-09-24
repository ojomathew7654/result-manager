import clsx from "clsx";
import { ChevronDown } from "lucide-react";

export default function Select({ className, children, ...props }) {
  return (
    <div className="relative">
      <select
        className={clsx(
          "w-full appearance-none rounded-lg border border-ink-200 bg-white px-3.5 py-2.5 pr-9 text-sm text-ink-900 transition-colors",
          "focus:border-brand-500 focus:ring-2 focus:ring-brand-100",
          className
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        size={16}
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-400"
      />
    </div>
  );
}
