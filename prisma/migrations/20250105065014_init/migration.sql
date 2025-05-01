/*
  Warnings:

  - Added the required column `noOfCorrectQuestions` to the `UserLevelComplete` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "UserLevelComplete" ADD COLUMN     "noOfCorrectQuestions" INTEGER NOT NULL;
