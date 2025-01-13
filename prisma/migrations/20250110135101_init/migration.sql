-- CreateEnum
CREATE TYPE "QuestionType" AS ENUM ('MCQ', 'FILL_IN_BLANK', 'MATCHING');

-- AlterTable
ALTER TABLE "Question" ADD COLUMN     "questionType" "QuestionType" NOT NULL DEFAULT 'MCQ';

-- AlterTable
ALTER TABLE "QuestionResponse" ADD COLUMN     "responseData" JSONB,
ALTER COLUMN "chosenAnswerId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "BlankSegment" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "isBlank" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL,
    "blankHint" TEXT,

    CONSTRAINT "BlankSegment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlankAnswer" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "blankIndex" INTEGER NOT NULL,
    "isCorrect" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "BlankAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MatchingPair" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "leftItem" TEXT NOT NULL,
    "rightItem" TEXT NOT NULL,
    "order" INTEGER NOT NULL,

    CONSTRAINT "MatchingPair_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "BlankSegment" ADD CONSTRAINT "BlankSegment_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlankAnswer" ADD CONSTRAINT "BlankAnswer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchingPair" ADD CONSTRAINT "MatchingPair_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;
