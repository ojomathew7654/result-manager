import clsx from "clsx";

const tones = {
  brand: "bg-brand-50 text-brand-700",
  amber: "bg-amber-100 text-amber-800",
  emerald: "bg-emerald-50 text-emerald-600",
  rose: "bg-rose-50 text-rose-500",
  ink: "bg-ink-100 text-ink-700",
};

/** Compact metric tile: icon chip + big number + label. Used on every dashboard. */
export default function StatCard({ icon: Icon, label, value, tone = "brand", className }) {
  return (
    <div
      className={clsx(
        "flex items-center gap-4 rounded-2xl border border-ink-100 bg-white p-5 shadow-card",
        className
      )}
    >
      <div className={clsx("flex h-11 w-11 shrink-0 items-center justify-center rounded-xl", tones[tone])}>
        {Icon ? <Icon size={20} strokeWidth={2} /> : null}
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-semibold font-display text-ink-900 leading-tight">{value}</p>
        <p className="truncate text-sm text-ink-400">{label}</p>
      </div>
    </div>
  );
}
