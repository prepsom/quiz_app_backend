import { Request, Response } from "express";
import { prisma } from "..";
import { Answer} from "@prisma/client";

type QuestionResponseRequestBody = {
    selectedAnswerId: string;
    questionId: string;
    timeTaken: number;
}

const POINTS_MAP: Record<string, number> = {
    "EASY": 10,
    "MEDIUM": 15,
    "HARD": 20
};

const TIME_BONUS_THRESHOLD = 60; // seconds
const TIME_BONUS_POINTS = 2;

const answerQuestionHandler = async (req: Request, res: Response) => {
    try {
        const { questionId, selectedAnswerId, timeTaken } = req.body as QuestionResponseRequestBody;
        const userId = req.userId;

        // Fetch user and question data in parallel
        const [user, question] = await Promise.all([
            prisma.user.findUnique({ where: { id: userId } }),
            prisma.question.findUnique({ 
                where: { id: questionId },
                include: { Answers: true }
            })
        ]);

        if (!user) {
            res.status(400).json({
                success: false,
                message: "Invalid user ID"
            });
            return;
        }

        if (!question) {
            res.status(400).json({
                success: false,
                message: "Question not found"
            });
            return;
        }        

        const selectedAnswer = question.Answers.find(answer => answer.id === selectedAnswerId);
        if (!selectedAnswer) {
            res.status(400).json({
                success: false,
                message: "Selected answer is not an option for the question"
            });
            return;
        }

        const pointsEarned = calculatePoints(selectedAnswer.isCorrect, question.difficulty, timeTaken);

        // if a questionResponse by the user to this question already exists -> update the record with the new selectedAnswer and isCorrect field
        // else create a questionResponse
        const questionResponse = await prisma.questionResponse.findFirst({where:{responderId:user.id,questionId:question.id}});
        if(questionResponse) {
            const updatedResponse = await prisma.questionResponse.update({where:{id:questionResponse.id},data:{
                isCorrect:selectedAnswer.isCorrect,
                chosenAnswerId:selectedAnswer.id,
                pointsEarned:pointsEarned,
                createdAt:new Date(Date.now()),
                responseTime:timeTaken,
            }});
            res.status(200).json({
                success: true,
                message: "Response recorded successfully",
                questionResponse:updatedResponse,
            });
        } else {
            const newResponse = await prisma.questionResponse.create({
                data: {
                    isCorrect: selectedAnswer.isCorrect,
                    pointsEarned,
                    responseTime: timeTaken,
                    chosenAnswerId: selectedAnswer.id,
                    questionId: question.id,
                    responderId: user.id,
                }
            });
            res.status(201).json({
                success: true,
                message: "Response recorded successfully",
                questionResponse:newResponse,
            });
        }
    } catch (error) {
        console.error("Error in answerQuestionHandler:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error when responding to question"
        });
    }
}

const calculatePoints = (isCorrect: boolean, difficulty: string, timeTaken: number): number => {
    if (!isCorrect) return 0;
    
    let points = POINTS_MAP[difficulty];
    if (timeTaken <= TIME_BONUS_THRESHOLD) {
        points += TIME_BONUS_POINTS;
    }
    
    return points;
}

export { answerQuestionHandler };