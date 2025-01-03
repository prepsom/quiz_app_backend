-- CreateTable
CREATE TABLE "UserLevelComplete" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "levelId" TEXT NOT NULL,
    "totalPoints" INTEGER NOT NULL,

    CONSTRAINT "UserLevelComplete_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserLevelComplete_userId_levelId_key" ON "UserLevelComplete"("userId", "levelId");

-- AddForeignKey
ALTER TABLE "UserLevelComplete" ADD CONSTRAINT "UserLevelComplete_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserLevelComplete" ADD CONSTRAINT "UserLevelComplete_levelId_fkey" FOREIGN KEY ("levelId") REFERENCES "Level"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
