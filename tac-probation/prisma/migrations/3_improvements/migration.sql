-- Add soft-delete and teacher token to Staff
ALTER TABLE "Staff" ADD COLUMN "deletedAt" TIMESTAMP(3);
ALTER TABLE "Staff" ADD COLUMN "teacherToken" TEXT;
CREATE UNIQUE INDEX "Staff_teacherToken_key" ON "Staff"("teacherToken");

-- Add step acknowledgement fields to ProbationStep
ALTER TABLE "ProbationStep" ADD COLUMN "teacherAcknowledgedAt" TIMESTAMP(3);
ALTER TABLE "ProbationStep" ADD COLUMN "acknowledgedAt" TIMESTAMP(3);
ALTER TABLE "ProbationStep" ADD COLUMN "acknowledgedBy" TEXT;

-- Create AuditLog table
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "performedBy" TEXT NOT NULL,
    "details" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);
