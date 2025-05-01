/*
  Warnings:

  - The `recommendations` column on the `UserLevelComplete` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `strengths` column on the `UserLevelComplete` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `weaknesses` column on the `UserLevelComplete` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "UserLevelComplete" DROP COLUMN "recommendations",
ADD COLUMN     "recommendations" TEXT[],
DROP COLUMN "strengths",
ADD COLUMN     "strengths" TEXT[],
DROP COLUMN "weaknesses",
ADD COLUMN     "weaknesses" TEXT[];
