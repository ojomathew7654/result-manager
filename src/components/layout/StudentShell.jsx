import StudentTopNav from "@/components/layout/StudentTopNav";

export default function StudentShell({ children }) {
  return (
    <div className="min-h-screen bg-paper">
      <StudentTopNav />
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
