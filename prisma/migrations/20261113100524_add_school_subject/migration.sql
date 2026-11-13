-- AlterTable
ALTER TABLE "Subject" ADD COLUMN     "schoolSubjectId" INTEGER;

-- CreateTable
CREATE TABLE "SchoolSubject" (
    "id" SERIAL NOT NULL,
    "schoolId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SchoolSubject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_TeacherSubjects" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateIndex
CREATE INDEX "SchoolSubject_schoolId_idx" ON "SchoolSubject"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "SchoolSubject_schoolId_name_key" ON "SchoolSubject"("schoolId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "_TeacherSubjects_AB_unique" ON "_TeacherSubjects"("A", "B");

-- CreateIndex
CREATE INDEX "_TeacherSubjects_B_index" ON "_TeacherSubjects"("B");

-- CreateIndex
CREATE INDEX "Subject_schoolSubjectId_idx" ON "Subject"("schoolSubjectId");

-- AddForeignKey
ALTER TABLE "SchoolSubject" ADD CONSTRAINT "SchoolSubject_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subject" ADD CONSTRAINT "Subject_schoolSubjectId_fkey" FOREIGN KEY ("schoolSubjectId") REFERENCES "SchoolSubject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_TeacherSubjects" ADD CONSTRAINT "_TeacherSubjects_A_fkey" FOREIGN KEY ("A") REFERENCES "SchoolSubject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_TeacherSubjects" ADD CONSTRAINT "_TeacherSubjects_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
