import StudentEditForm from "@/components/admin/StudentEditForm";

export default function EditSecondaryStudent({ params }) {
  return <StudentEditForm studentId={params.studentId} redirectPath="/admin/secondary" title="Edit secondary student" />;
}
