import clsx from "clsx";

const variants = {
  primary:
    "bg-brand-600 text-white hover:bg-brand-700 shadow-soft focus-visible:outline-brand-600",
  amber: "bg-amber-400 text-ink-900 hover:bg-amber-500 shadow-soft",
  outline:
    "border border-ink-200 text-ink-700 bg-white hover:border-brand-300 hover:text-brand-700",
  ghost: "text-ink-500 hover:bg-ink-100 hover:text-ink-900",
  danger: "bg-rose-500 text-white hover:bg-rose-600 shadow-soft",
  subtle: "bg-brand-50 text-brand-700 hover:bg-brand-100",
};

const sizes = {
  sm: "text-xs px-3 py-1.5 gap-1.5",
  md: "text-sm px-4 py-2.5 gap-2",
  lg: "text-sm px-5 py-3 gap-2",
};

export default function Button({
  as: Tag = "button",
  variant = "primary",
  size = "md",
  icon: Icon,
  className,
  children,
  ...props
}) {
  return (
    <Tag
      className={clsx(
        "inline-flex items-center justify-center rounded-lg font-medium transition-colors duration-150 disabled:opacity-50 disabled:pointer-events-none",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {Icon ? <Icon size={16} strokeWidth={2} /> : null}
      {children}
    </Tag>
  );
}
