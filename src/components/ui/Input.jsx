import clsx from "clsx";

export default function Input({ className, icon: Icon, error, ...props }) {
  return (
    <div className="relative">
      {Icon ? (
        <Icon
          size={16}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-300"
        />
      ) : null}
      <input
        className={clsx(
          "w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm text-ink-900 placeholder:text-ink-300 transition-colors",
          "focus:border-brand-500 focus:ring-2 focus:ring-brand-100",
          error ? "border-rose-300" : "border-ink-200",
          Icon && "pl-9",
          className
        )}
        {...props}
      />
    </div>
  );
}
