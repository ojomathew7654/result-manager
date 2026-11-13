-- DropForeignKey
ALTER TABLE "Subject" DROP CONSTRAINT "Subject_termId_fkey";

-- AddForeignKey
ALTER TABLE "Subject" ADD CONSTRAINT "Subject_termId_fkey" FOREIGN KEY ("termId") REFERENCES "Term"("id") ON DELETE CASCADE ON UPDATE CASCADE;
