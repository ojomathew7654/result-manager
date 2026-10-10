import Link from "next/link";
import { GraduationCap, ArrowLeft } from "lucide-react";

export default function AuthCard({ eyebrow, title, subtitle, children }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-ink-900 px-4 py-10">
      <div className="w-full max-w-md">
        <Link href="/" className="mb-6 flex items-center gap-2 text-sm font-medium text-ink-300 hover:text-white">
          <ArrowLeft size={15} />
          Back to portal selection
        </Link>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur">
          <div className="mb-6 flex h-11 w-11 items-center justify-center rounded-xl bg-amber-400 text-ink-900">
            <GraduationCap size={22} strokeWidth={2.25} />
          </div>
          <p className="text-xs font-medium uppercase tracking-wide text-amber-300">{eyebrow}</p>
          <h1 className="mt-2 font-display text-2xl font-semibold text-white">{title}</h1>
          {subtitle ? <p className="mt-2 text-sm text-ink-300">{subtitle}</p> : null}

          <div className="mt-7">{children}</div>
        </div>
      </div>
    </div>
  );
}
