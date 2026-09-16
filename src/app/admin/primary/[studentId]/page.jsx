import StudentEditForm from "@/components/admin/StudentEditForm";

export default function EditPrimaryStudent({ params }) {
  return <StudentEditForm studentId={params.studentId} redirectPath="/admin/primary" title="Edit primary student" />;
}
