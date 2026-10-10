import { GraduationCap, User } from "lucide-react";
import { Card, CardBody } from "@/components/ui/Card";
import { schoolInfo } from "@/lib/mockData";

export default function StudentIdCard({ student }) {
  return (
    <Card className="mx-auto max-w-lg print-area">
      <CardBody className="text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-50 text-brand-700">
          <GraduationCap size={26} />
        </div>
        <h2 className="mt-3 font-display text-xl font-semibold text-ink-900">{schoolInfo.name}</h2>
        <p className="text-sm italic text-ink-400">{schoolInfo.motto}</p>

        <div className="mt-6 flex items-center gap-4 rounded-xl bg-ink-50 p-4 text-left">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-2 border-amber-400 bg-white text-ink-300">
            <User size={28} />
          </div>
          <div>
            <p className="font-display text-lg font-semibold text-ink-900">{student.name}</p>
            <dl className="mt-1 grid grid-cols-2 gap-x-4 text-xs text-ink-500">
              <div>
                <dt className="inline text-ink-400">Reg no: </dt>
                <dd className="inline">{student.registrationNumber}</dd>
              </div>
              <div>
                <dt className="inline text-ink-400">Level: </dt>
                <dd className="inline">{student.level}</dd>
              </div>
              <div>
                <dt className="inline text-ink-400">Gender: </dt>
                <dd className="inline">{student.gender}</dd>
              </div>
              <div>
                <dt className="inline text-ink-400">Age: </dt>
                <dd className="inline">{student.age}</dd>
              </div>
              <div className="col-span-2">
                <dt className="inline text-ink-400">Academic year: </dt>
                <dd className="inline">{student.academicYear}</dd>
              </div>
            </dl>
          </div>
        </div>

        <div className="mt-6 border-t border-ink-100 pt-4 text-left text-sm text-ink-600">
          <p className="mb-2 font-medium text-ink-900">Contact information</p>
          <p>Address: {schoolInfo.address}</p>
          <p>Email: {schoolInfo.email}</p>
          <p>Phone: {schoolInfo.phone}</p>
          <p className="mt-2 text-ink-400">Head master: {schoolInfo.headmaster}</p>
        </div>
      </CardBody>
    </Card>
  );
}
