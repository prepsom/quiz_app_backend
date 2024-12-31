-- CreateEnum
CREATE TYPE "Role" AS ENUM ('STUDENT', 'TEACHER', 'ADMIN');

-- CreateEnum
CREATE TYPE "Avatar" AS ENUM ('MALE', 'FEMALE');

-- CreateEnum
CREATE TYPE "Difficulty" AS ENUM ('EASY', 'MEDIUM', 'HARD');

-- CreateTable
CREATE TABLE "Grade" (
    "id" TEXT NOT NULL,
    "grade" INTEGER NOT NULL,

    CONSTRAINT "Grade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'STUDENT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "avatar" "Avatar" NOT NULL DEFAULT 'MALE',
    "gradeId" TEXT NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subject" (
    "id" TEXT NOT NULL,
    "subjectName" TEXT NOT NULL,
    "gradeId" TEXT NOT NULL,

    CONSTRAINT "Subject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Level" (
    "id" TEXT NOT NULL,
    "levelName" TEXT NOT NULL,
    "levelDescription" TEXT,
    "subjectId" TEXT NOT NULL,

    CONSTRAINT "Level_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Question" (
    "id" TEXT NOT NULL,
    "questionTitle" TEXT NOT NULL,
    "questionHint" TEXT,
    "difficulty" "Difficulty" NOT NULL DEFAULT 'EASY',
    "levelId" TEXT NOT NULL,
    "correctAnswerId" TEXT NOT NULL,

    CONSTRAINT "Question_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Answer" (
    "id" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,

    CONSTRAINT "Answer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestionResponse" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "responderId" TEXT NOT NULL,
    "chosenAnswerId" TEXT NOT NULL,
    "pointsEarned" INTEGER NOT NULL,
    "isCorrect" BOOLEAN NOT NULL,
    "responseTime" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuestionResponse_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Question_correctAnswerId_key" ON "Question"("correctAnswerId");

-- CreateIndex
CREATE UNIQUE INDEX "QuestionResponse_responderId_questionId_key" ON "QuestionResponse"("responderId", "questionId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_gradeId_fkey" FOREIGN KEY ("gradeId") REFERENCES "Grade"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subject" ADD CONSTRAINT "Subject_gradeId_fkey" FOREIGN KEY ("gradeId") REFERENCES "Grade"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Level" ADD CONSTRAINT "Level_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_levelId_fkey" FOREIGN KEY ("levelId") REFERENCES "Level"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_correctAnswerId_fkey" FOREIGN KEY ("correctAnswerId") REFERENCES "Answer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Answer" ADD CONSTRAINT "Answer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionResponse" ADD CONSTRAINT "QuestionResponse_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionResponse" ADD CONSTRAINT "QuestionResponse_responderId_fkey" FOREIGN KEY ("responderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionResponse" ADD CONSTRAINT "QuestionResponse_chosenAnswerId_fkey" FOREIGN KEY ("chosenAnswerId") REFERENCES "Answer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
