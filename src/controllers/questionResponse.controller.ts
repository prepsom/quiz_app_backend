import e, { Request, Response } from "express";
import { prisma } from "..";
import { Answer } from "@prisma/client";


type QuestionResponseRequestBody = {
    selectedAnswerId:string; // answer to the question
    questionId:string; // question user is answering
    timeTaken:number; // in seconds
}


const answerQuestionHandler = async (req:Request,res:Response) => {
    try {
        const {questionId,selectedAnswerId,timeTaken} = req.body as QuestionResponseRequestBody;
        const userId = req.userId;
    
        const user = await prisma.user.findUnique({where:{id:userId}});
        if(!user) {
            res.status(400).json({
                "success":false,
                "message":"invalid user id"
            })
            return;
        }
    
        const question = await prisma.question.findUnique({where:{id:questionId},include:{
            Answers:true,
        }});
        if(!question) {
            // error resposne (400)
            return;
        }
        const selectedAnswer = await prisma.answer.findUnique({where:{id:selectedAnswerId}});
        if(!selectedAnswer) {
            // error resposne
            return;
        }
    
        const selectedAnswerInQuestionAnswers = question.Answers.find((answer:Answer) => answer.id===selectedAnswer.id); 
        if(!selectedAnswerInQuestionAnswers) {
            res.status(400).json({
                "success":false,
                "message":"selected answer is not an option for the question"
            })
            return;
        }
        const isAnswerCorrect = selectedAnswerInQuestionAnswers.isCorrect;
        const questionDifficulty = question.difficulty;
    
        let pointsEarned:number;
        if(isAnswerCorrect) {
            
            switch(questionDifficulty) {
                case "EASY":
                    pointsEarned = 10
                    break;
                case "MEDIUM":
                    pointsEarned = 15
                    break;
                case "HARD":
                    pointsEarned = 20
                    break;
            }
    
            // bonus point 
            if(timeTaken <= 60)  {
                pointsEarned+=2
            }
        } else {
            pointsEarned = 0;
        } 
    
        const questionResponse = await prisma.questionResponse.create({
            data:{
                isCorrect:isAnswerCorrect,
                pointsEarned:pointsEarned,
                responseTime:timeTaken,
                chosenAnswerId:selectedAnswer.id,
                questionId:question.id,
                responderId:user.id,
            }
        });
        res.status(201).json({
            "success":true,
            "message":"user responded to question successfully",
            questionResponse,
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            "success":false,
            "message":"internal server error when responding to question"
        });
    }
}


export {
    answerQuestionHandler,
}