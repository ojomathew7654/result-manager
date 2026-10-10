import clsx from "clsx";

export default function Avatar({ name = "", size = 36, className }) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return (
    <div
      style={{ width: size, height: size }}
      className={clsx(
        "flex shrink-0 items-center justify-center rounded-full bg-brand-100 font-display text-sm font-semibold text-brand-700",
        className
      )}
    >
      {initials || "?"}
    </div>
  );
}
