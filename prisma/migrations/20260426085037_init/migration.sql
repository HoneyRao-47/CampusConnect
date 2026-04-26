-- CreateTable
CREATE TABLE "Ambassador" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "college" TEXT NOT NULL,
    "referrals" INTEGER NOT NULL DEFAULT 0,
    "contentPosts" INTEGER NOT NULL DEFAULT 0,
    "events" INTEGER NOT NULL DEFAULT 0,
    "points" INTEGER NOT NULL DEFAULT 0,
    "streak" INTEGER NOT NULL DEFAULT 0
);

-- CreateTable
CREATE TABLE "Task" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "points" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "dueDate" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Submission" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "taskId" TEXT NOT NULL,
    "ambassadorId" TEXT NOT NULL,
    "notes" TEXT NOT NULL,
    "proofUrl" TEXT,
    "hasFileProof" BOOLEAN NOT NULL DEFAULT false,
    "awardedPoints" INTEGER NOT NULL,
    "submittedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Submission_ambassadorId_fkey" FOREIGN KEY ("ambassadorId") REFERENCES "Ambassador" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Submission_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Submission_taskId_idx" ON "Submission"("taskId");

-- CreateIndex
CREATE INDEX "Submission_ambassadorId_idx" ON "Submission"("ambassadorId");
