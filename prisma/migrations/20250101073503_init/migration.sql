/*
  Warnings:

  - You are about to drop the column `correctAnswerId` on the `Question` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Question" DROP CONSTRAINT "Question_correctAnswerId_fkey";

-- DropIndex
DROP INDEX "Question_correctAnswerId_key";

-- AlterTable
ALTER TABLE "Answer" ADD COLUMN     "isCorrect" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Question" DROP COLUMN "correctAnswerId";
