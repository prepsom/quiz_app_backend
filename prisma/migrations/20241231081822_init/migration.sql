-- AlterTable
ALTER TABLE "User" ALTER COLUMN "gradeId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "TeacherGrade" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "gradeId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TeacherGrade_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TeacherGrade_teacherId_gradeId_key" ON "TeacherGrade"("teacherId", "gradeId");

-- AddForeignKey
ALTER TABLE "TeacherGrade" ADD CONSTRAINT "TeacherGrade_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeacherGrade" ADD CONSTRAINT "TeacherGrade_gradeId_fkey" FOREIGN KEY ("gradeId") REFERENCES "Grade"("id") ON DELETE CASCADE ON UPDATE CASCADE;
