-- DropForeignKey
ALTER TABLE "Answer" DROP CONSTRAINT "Answer_questionId_fkey";

-- DropForeignKey
ALTER TABLE "Level" DROP CONSTRAINT "Level_subjectId_fkey";

-- DropForeignKey
ALTER TABLE "Question" DROP CONSTRAINT "Question_correctAnswerId_fkey";

-- DropForeignKey
ALTER TABLE "Question" DROP CONSTRAINT "Question_levelId_fkey";

-- DropForeignKey
ALTER TABLE "QuestionResponse" DROP CONSTRAINT "QuestionResponse_chosenAnswerId_fkey";

-- DropForeignKey
ALTER TABLE "QuestionResponse" DROP CONSTRAINT "QuestionResponse_questionId_fkey";

-- DropForeignKey
ALTER TABLE "QuestionResponse" DROP CONSTRAINT "QuestionResponse_responderId_fkey";

-- DropForeignKey
ALTER TABLE "Subject" DROP CONSTRAINT "Subject_gradeId_fkey";

-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_gradeId_fkey";

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_gradeId_fkey" FOREIGN KEY ("gradeId") REFERENCES "Grade"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subject" ADD CONSTRAINT "Subject_gradeId_fkey" FOREIGN KEY ("gradeId") REFERENCES "Grade"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Level" ADD CONSTRAINT "Level_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_levelId_fkey" FOREIGN KEY ("levelId") REFERENCES "Level"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_correctAnswerId_fkey" FOREIGN KEY ("correctAnswerId") REFERENCES "Answer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Answer" ADD CONSTRAINT "Answer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionResponse" ADD CONSTRAINT "QuestionResponse_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionResponse" ADD CONSTRAINT "QuestionResponse_responderId_fkey" FOREIGN KEY ("responderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionResponse" ADD CONSTRAINT "QuestionResponse_chosenAnswerId_fkey" FOREIGN KEY ("chosenAnswerId") REFERENCES "Answer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
