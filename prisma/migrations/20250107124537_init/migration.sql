-- AlterTable
ALTER TABLE "UserLevelComplete" ADD COLUMN     "recommendations" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "strengths" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "weaknesses" TEXT NOT NULL DEFAULT '';
