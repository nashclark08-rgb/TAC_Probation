-- SupportingStaff: admin access flag
ALTER TABLE "SupportingStaff" ADD COLUMN "canAccessAdmin" BOOLEAN NOT NULL DEFAULT false;

-- Probation: optional extension end date for recalculating step windows
ALTER TABLE "Probation" ADD COLUMN "extensionEndDate" TIMESTAMP(3);
