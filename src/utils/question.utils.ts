import { prisma } from "..";


export async function updateQuestionReadyStatus(questionId: string) {
    const question = await prisma.question.findUnique({
      where: { id: questionId },
      include: { MCQAnswers: true }
    });
    
    const ready = question?.MCQAnswers.length === 4 && 
                  question.MCQAnswers.some(a => a.isCorrect);
                  
    await prisma.question.update({
      where: { id: questionId },
      data: { ready }
    });
  }