-- AlterTable
ALTER TABLE "Staff" ADD COLUMN "academicAdminId" TEXT;
ALTER TABLE "Staff" ADD COLUMN "principalId" TEXT;

-- AddForeignKey
ALTER TABLE "Staff" ADD CONSTRAINT "Staff_academicAdminId_fkey" FOREIGN KEY ("academicAdminId") REFERENCES "SupportingStaff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Staff" ADD CONSTRAINT "Staff_principalId_fkey" FOREIGN KEY ("principalId") REFERENCES "SupportingStaff"("id") ON DELETE SET NULL ON UPDATE CASCADE;
