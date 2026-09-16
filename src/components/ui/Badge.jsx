import clsx from "clsx";

const tones = {
  neutral: "bg-ink-100 text-ink-600",
  brand: "bg-brand-50 text-brand-700",
  amber: "bg-amber-100 text-amber-800",
  success: "bg-emerald-50 text-emerald-600",
  danger: "bg-rose-50 text-rose-500",
};

export default function Badge({ tone = "neutral", children, className }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium",
        tones[tone],
        className
      )}
    >
      {children}
    </span>
  );
}
