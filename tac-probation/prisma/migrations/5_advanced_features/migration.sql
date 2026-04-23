-- ProbationStep: add custom step support + replace unique constraint with sortOrder

ALTER TABLE "ProbationStep" ADD COLUMN "customLabel" TEXT;
ALTER TABLE "ProbationStep" ADD COLUMN "isCustom" BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE "ProbationStep" ADD COLUMN "sortOrder" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "ProbationStep" ADD COLUMN "customTitle" TEXT;

-- Backfill sortOrder from stepNumber for existing rows
UPDATE "ProbationStep" SET "sortOrder" = "stepNumber"::DOUBLE PRECISION;

-- Replace stepNumber uniqueness with sortOrder uniqueness
ALTER TABLE "ProbationStep" DROP CONSTRAINT IF EXISTS "ProbationStep_probationId_stepNumber_key";
ALTER TABLE "ProbationStep" ADD CONSTRAINT "ProbationStep_probationId_sortOrder_key" UNIQUE ("probationId", "sortOrder");

-- Probation: extension tracking fields
ALTER TABLE "Probation" ADD COLUMN "extensionReason" TEXT;
ALTER TABLE "Probation" ADD COLUMN "extendedAt" TIMESTAMP(3);
ALTER TABLE "Probation" ADD COLUMN "extendedBy" TEXT;
ALTER TABLE "Probation" ADD COLUMN "extensionFromStep" INTEGER;

-- Staff: step access grants (JSON per role slot)
ALTER TABLE "Staff" ADD COLUMN "stepAccessGrants" TEXT;

-- AuditLog: staffId for efficient per-staff lookup
ALTER TABLE "AuditLog" ADD COLUMN "staffId" TEXT;
CREATE INDEX "AuditLog_staffId_idx" ON "AuditLog"("staffId");
