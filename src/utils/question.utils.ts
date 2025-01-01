import { prisma } from "..";


export async function updateQuestionReadyStatus(questionId: string) {
    const question = await prisma.question.findUnique({
      where: { id: questionId },
      include: { Answers: true }
    });
    
    const ready = question?.Answers.length === 4 && 
                  question.Answers.some(a => a.isCorrect);
                  
    await prisma.question.update({
      where: { id: questionId },
      data: { ready }
    });
  }