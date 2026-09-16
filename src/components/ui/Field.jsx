import clsx from "clsx";

/**
 * Field wraps any control (Input, Select, Textarea) with a consistent
 * label + helper/error message so every form in the app lines up the same way.
 */
export default function Field({ label, htmlFor, hint, error, required, className, children }) {
  return (
    <div className={clsx("flex flex-col gap-1.5", className)}>
      {label ? (
        <label htmlFor={htmlFor} className="text-sm font-medium">
          {label}
          {required ? <span className="text-rose-500"> *</span> : null}
        </label>
      ) : null}
      {children}
      {error ? (
        <p className="text-xs text-rose-500">{error}</p>
      ) : hint ? (
        <p className="text-xs text-ink-400">{hint}</p>
      ) : null}
    </div>
  );
}
