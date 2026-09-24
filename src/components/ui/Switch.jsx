import clsx from "clsx";

/** A labeled on/off switch, used for things like "make result available". */
export default function Switch({ checked, onChange, label, disabled }) {
  return (
    <label
      className={clsx(
        "inline-flex items-center gap-2.5 select-none",
        disabled ? "opacity-50" : "cursor-pointer"
      )}
    >
      <span
        onClick={() => !disabled && onChange && onChange(!checked)}
        className={clsx(
          "relative inline-flex h-5.5 w-10 shrink-0 items-center rounded-full transition-colors h-6 w-11",
          checked ? "bg-emerald-500" : "bg-ink-200"
        )}
      >
        <span
          className={clsx(
            "inline-block h-4.5 w-4.5 h-5 w-5 transform rounded-full bg-white shadow transition-transform",
            checked ? "translate-x-5.5 translate-x-5" : "translate-x-1"
          )}
        />
      </span>
      {label ? (
        <span className={clsx("text-sm font-medium", checked ? "text-emerald-600" : "text-ink-500")}>
          {label}
        </span>
      ) : null}
    </label>
  );
}
