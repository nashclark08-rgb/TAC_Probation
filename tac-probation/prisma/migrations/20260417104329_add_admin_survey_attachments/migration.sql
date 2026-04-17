/*
  Warnings:

  - You are about to drop the `Administrator` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropIndex
DROP INDEX "Administrator_email_key";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Administrator";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "SupportingStaff" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "subSchool" TEXT,
    "department" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "TermCalendar" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "year" INTEGER NOT NULL,
    "term" INTEGER NOT NULL,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "StepAttachment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "stepId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "uploadedBy" TEXT NOT NULL,
    "uploadedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StepAttachment_stepId_fkey" FOREIGN KEY ("stepId") REFERENCES "ProbationStep" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Survey" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "stepId" TEXT NOT NULL,
    "sentById" TEXT,
    "recipientEmails" TEXT NOT NULL,
    "sentAt" DATETIME,
    "closedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Survey_stepId_fkey" FOREIGN KEY ("stepId") REFERENCES "ProbationStep" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Survey_sentById_fkey" FOREIGN KEY ("sentById") REFERENCES "SupportingStaff" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SurveyResponse" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "surveyId" TEXT NOT NULL,
    "respondentName" TEXT NOT NULL,
    "respondentEmail" TEXT NOT NULL,
    "overallRating" TEXT NOT NULL,
    "strengths" TEXT,
    "concerns" TEXT,
    "additionalNotes" TEXT,
    "submittedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SurveyResponse_surveyId_fkey" FOREIGN KEY ("surveyId") REFERENCES "Survey" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "EmailLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "to" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "relatedId" TEXT,
    "sentAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'sent',
    "error" TEXT
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Staff" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "subSchool" TEXT NOT NULL,
    "department" TEXT,
    "teachingRole" TEXT,
    "startDate" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "hodId" TEXT,
    "stageLeaderId" TEXT,
    "deanId" TEXT,
    "directorId" TEXT,
    "deputyId" TEXT,
    CONSTRAINT "Staff_hodId_fkey" FOREIGN KEY ("hodId") REFERENCES "SupportingStaff" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Staff_stageLeaderId_fkey" FOREIGN KEY ("stageLeaderId") REFERENCES "SupportingStaff" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Staff_deanId_fkey" FOREIGN KEY ("deanId") REFERENCES "SupportingStaff" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Staff_directorId_fkey" FOREIGN KEY ("directorId") REFERENCES "SupportingStaff" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Staff_deputyId_fkey" FOREIGN KEY ("deputyId") REFERENCES "SupportingStaff" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Staff" ("createdAt", "department", "email", "id", "name", "startDate", "subSchool") SELECT "createdAt", "department", "email", "id", "name", "startDate", "subSchool" FROM "Staff";
DROP TABLE "Staff";
ALTER TABLE "new_Staff" RENAME TO "Staff";
CREATE UNIQUE INDEX "Staff_email_key" ON "Staff"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "SupportingStaff_email_key" ON "SupportingStaff"("email");

-- CreateIndex
CREATE UNIQUE INDEX "TermCalendar_year_term_key" ON "TermCalendar"("year", "term");

-- CreateIndex
CREATE UNIQUE INDEX "Survey_stepId_key" ON "Survey"("stepId");
