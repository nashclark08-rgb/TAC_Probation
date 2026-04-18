ALTER TABLE "SupportingStaff" ADD COLUMN "portalToken" TEXT;
UPDATE "SupportingStaff" SET "portalToken" = gen_random_uuid()::text WHERE "portalToken" IS NULL;
ALTER TABLE "SupportingStaff" ALTER COLUMN "portalToken" SET NOT NULL;
CREATE UNIQUE INDEX "SupportingStaff_portalToken_key" ON "SupportingStaff"("portalToken");
