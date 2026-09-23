import { cn } from "@/utils/utils";

export default function PageHeader({
  title,
  subtitle,
  action,
  className,
  titleClassName,
  subtitleClassName,
  dark = true,
}) {
  return (
    <div className={cn("mb-6 flex flex-wrap items-start justify-between gap-4", className)}>
      <div>
        <h1
          className={cn(
            "font-display text-2xl font-semibold",
            dark ? "text-white" : "text-ink-900",
            titleClassName
          )}
        >
          {title}
        </h1>
        {subtitle ? (
          <p
            className={cn(
              "mt-1 text-sm",
              dark ? "text-ink-300" : "text-ink-400",
              subtitleClassName
            )}
          >
            {subtitle}
          </p>
        ) : null}
      </div>
      {action ? <div className="flex shrink-0 items-center gap-2">{action}</div> : null}
    </div>
  );
}
