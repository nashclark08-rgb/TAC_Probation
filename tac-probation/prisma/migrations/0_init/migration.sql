-- CreateTable
CREATE TABLE "SupportingStaff" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "subSchool" TEXT,
    "department" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupportingStaff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TermCalendar" (
    "id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "term" INTEGER NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TermCalendar_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Staff" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "subSchool" TEXT NOT NULL,
    "department" TEXT,
    "teachingRole" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "hodId" TEXT,
    "stageLeaderId" TEXT,
    "deanId" TEXT,
    "directorId" TEXT,
    "deputyId" TEXT,

    CONSTRAINT "Staff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Probation" (
    "id" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "currentStep" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Probation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProbationStep" (
    "id" TEXT NOT NULL,
    "probationId" TEXT NOT NULL,
    "stepNumber" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "outcome" TEXT,
    "completedAt" TIMESTAMP(3),
    "completedBy" TEXT,
    "notes" TEXT,
    "supportActions" TEXT,
    "formData" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProbationStep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StepAttachment" (
    "id" TEXT NOT NULL,
    "stepId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "uploadedBy" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StepAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Survey" (
    "id" TEXT NOT NULL,
    "stepId" TEXT NOT NULL,
    "sentById" TEXT,
    "recipientEmails" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Survey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SurveyResponse" (
    "id" TEXT NOT NULL,
    "surveyId" TEXT NOT NULL,
    "respondentName" TEXT NOT NULL,
    "respondentEmail" TEXT NOT NULL,
    "overallRating" TEXT NOT NULL,
    "strengths" TEXT,
    "concerns" TEXT,
    "additionalNotes" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SurveyResponse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EarlyConcern" (
    "id" TEXT NOT NULL,
    "probationId" TEXT NOT NULL,
    "triggeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "triggeredBy" TEXT NOT NULL,
    "triggerStep" INTEGER NOT NULL,
    "triggers" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "actionsTaken" TEXT,
    "supportMeasures" TEXT,
    "resolution" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EarlyConcern_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailLog" (
    "id" TEXT NOT NULL,
    "to" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "relatedId" TEXT,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'sent',
    "error" TEXT,

    CONSTRAINT "EmailLog_pkey" PRIMARY KEY ("id")
);

-- CreateUniqueIndex
CREATE UNIQUE INDEX "SupportingStaff_email_key" ON "SupportingStaff"("email");

-- CreateUniqueIndex
CREATE UNIQUE INDEX "TermCalendar_year_term_key" ON "TermCalendar"("year", "term");

-- CreateUniqueIndex
CREATE UNIQUE INDEX "Staff_email_key" ON "Staff"("email");

-- CreateUniqueIndex
CREATE UNIQUE INDEX "Probation_staffId_key" ON "Probation"("staffId");

-- CreateUniqueIndex
CREATE UNIQUE INDEX "ProbationStep_probationId_stepNumber_key" ON "ProbationStep"("probationId", "stepNumber");

-- CreateUniqueIndex
CREATE UNIQUE INDEX "Survey_stepId_key" ON "Survey"("stepId");

-- AddForeignKey
ALTER TABLE "Staff" ADD CONSTRAINT "Staff_hodId_fkey" FOREIGN KEY ("hodId") REFERENCES "SupportingStaff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Staff" ADD CONSTRAINT "Staff_stageLeaderId_fkey" FOREIGN KEY ("stageLeaderId") REFERENCES "SupportingStaff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Staff" ADD CONSTRAINT "Staff_deanId_fkey" FOREIGN KEY ("deanId") REFERENCES "SupportingStaff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Staff" ADD CONSTRAINT "Staff_directorId_fkey" FOREIGN KEY ("directorId") REFERENCES "SupportingStaff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Staff" ADD CONSTRAINT "Staff_deputyId_fkey" FOREIGN KEY ("deputyId") REFERENCES "SupportingStaff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Probation" ADD CONSTRAINT "Probation_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProbationStep" ADD CONSTRAINT "ProbationStep_probationId_fkey" FOREIGN KEY ("probationId") REFERENCES "Probation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StepAttachment" ADD CONSTRAINT "StepAttachment_stepId_fkey" FOREIGN KEY ("stepId") REFERENCES "ProbationStep"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Survey" ADD CONSTRAINT "Survey_stepId_fkey" FOREIGN KEY ("stepId") REFERENCES "ProbationStep"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Survey" ADD CONSTRAINT "Survey_sentById_fkey" FOREIGN KEY ("sentById") REFERENCES "SupportingStaff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SurveyResponse" ADD CONSTRAINT "SurveyResponse_surveyId_fkey" FOREIGN KEY ("surveyId") REFERENCES "Survey"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EarlyConcern" ADD CONSTRAINT "EarlyConcern_probationId_fkey" FOREIGN KEY ("probationId") REFERENCES "Probation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
