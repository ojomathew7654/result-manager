import clsx from "clsx";

export function Card({ className, children, ...props }) {
  return (
    <div
      className={clsx(
        "rounded-2xl border border-ink-100 bg-white shadow-card",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ title, subtitle, action, className }) {
  return (
    <div className={clsx("flex items-start justify-between gap-4 border-b border-ink-100 px-5 py-4", className)}>
      <div>
        <h3 className="font-display text-base font-semibold text-ink-900">{title}</h3>
        {subtitle ? <p className="mt-0.5 text-sm text-ink-400">{subtitle}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function CardBody({ className, children }) {
  return <div className={clsx("p-5", className)}>{children}</div>;
}
