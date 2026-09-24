import { Card, CardBody } from "@/components/ui/Card";
import Table from "@/components/ui/Table";
import Badge from "@/components/ui/Badge";

const subjectColumns = [
  { key: "no", header: "No", width: 40, render: (_r, i) => i + 1 },
  { key: "subject", header: "Subject" },
  { key: "ca1", header: "1st CA", align: "center" },
  { key: "ca2", header: "2nd CA", align: "center" },
  { key: "project", header: "Project", align: "center" },
  { key: "assignment", header: "Assignment", align: "center" },
  { key: "exam", header: "Exam", align: "center" },
  {
    key: "total",
    header: "Total",
    align: "center",
    render: (row) => <span className="font-semibold text-brand-700">{row.total}</span>,
  },
];

export default function ReportCard({ student, subjects, term = "First term" }) {
  return (
    <Card className="print-area">
      <CardBody>
        <div className="flex flex-col justify-between gap-4 border-b border-ink-100 pb-5 sm:flex-row sm:items-center">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-brand-600">{term}</p>
            <h3 className="mt-1 font-display text-lg font-semibold text-ink-900">{student.name}</h3>
            <p className="text-sm text-ink-400">
              {student.level} &middot; Form teacher: {student.formTeacher}
            </p>
          </div>
          <div className="flex gap-2">
            <Badge tone="brand">{student.gender}</Badge>
            {student.age ? <Badge tone="neutral">Age {student.age}</Badge> : null}
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl bg-ink-50 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-ink-400">Form teacher&apos;s comment</p>
            <p className="mt-1.5 text-sm text-ink-700">{student.formTeacherComment}</p>
          </div>
          <div className="rounded-xl bg-ink-50 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-ink-400">Head of school&apos;s comment</p>
            <p className="mt-1.5 text-sm text-ink-700">{student.headComment}</p>
          </div>
        </div>

        <div className="mt-6">
          <Table columns={subjectColumns} rows={subjects} rowKey="subject" dense />
        </div>
      </CardBody>
    </Card>
  );
}
