-- DropForeignKey
ALTER TABLE "UserLevelComplete" DROP CONSTRAINT "UserLevelComplete_levelId_fkey";

-- DropForeignKey
ALTER TABLE "UserLevelComplete" DROP CONSTRAINT "UserLevelComplete_userId_fkey";

-- AddForeignKey
ALTER TABLE "UserLevelComplete" ADD CONSTRAINT "UserLevelComplete_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserLevelComplete" ADD CONSTRAINT "UserLevelComplete_levelId_fkey" FOREIGN KEY ("levelId") REFERENCES "Level"("id") ON DELETE CASCADE ON UPDATE CASCADE;
