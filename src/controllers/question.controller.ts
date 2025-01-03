import { Request, Response } from "express"
import { prisma } from "..";
import { Answer } from "@prisma/client";

type AddQuestionRequestBody = {
    questionTitle:string;
    difficulty:"EASY" | "MEDIUM" | "HARD"
    levelId:string;
}

const getQuestionsByLevelHandler = async (req:Request,res:Response) => {
    // levelId and userId
    try {
        const {levelId} = req.params as {levelId:string}
        const userId = req.userId;
        
        const user = await prisma.user.findUnique({where:{id:userId}});
        if(!user) {
            res.status(400).json({
                "success":false,
                "message":"invalid user id"
            })
            return;
        }   

        const level = await prisma.level.findUnique({where:{id:levelId},include:{
            subject:true,
        }});
        
        if(!level) {
            res.status(400).json({
                "success":false,
                "message":"invalid level id"
            })
            return;
        }
    
        // level exists so can get questions under a level
        // if the user is a student then to see questions under a level
        // student has to be in the same grade the level is in 
        const gradeId = level.subject.gradeId;
        if(user.role==="STUDENT" && user.gradeId!==gradeId) {
            res.status(401).json({
                "success":false,
                "message":"user cannot access questions for this level"
            })
            return;
        }
    
        // user is part of this grade here 
        if(user.role==="TEACHER") {
            // teacher teaches this grade that the questions are in then its cool
            const teachesGrade = await prisma.teacherGrade.findFirst({where:{teacherId:user.id,gradeId:gradeId}});
            if(!teachesGrade) {
                res.status(401).json({
                    "success":false,
                    "message":"teacher cannot view questions of this grade"
                });
                return;
            }
        }
    
        const questions = await prisma.question.findMany({where:{levelId:level.id}});
        res.status(200).json({
            "success":true,
            questions,
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            "success":false,
            "message":"internal server error when getting questions for a level"
        });
    }
}

const addQuestionByLevelHandler = async (req:Request,res:Response) => {
    try {
        const {difficulty,levelId,questionTitle} = req.body as AddQuestionRequestBody;
        const userId = req.userId;
    
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user || user.role=="STUDENT") {
            res.status(401).json({
                success: false,
                message: "Only teachers can add questions"
            });
            return;
        }
    
        const level = await prisma.level.findUnique({
            where: { id: levelId },
            include: {
                subject: true,
            }
        });
    
        if (!level) {
            res.status(400).json({
                success: false,
                message: "Invalid level id"
            });
            return;
        }
    
        if(user.role==="TEACHER") {
            const teacherGrade = await prisma.teacherGrade.findFirst({
                where: {
                    teacherId: userId,
                    gradeId: level.subject.gradeId
                }
            });
            if (!teacherGrade) {
                res.status(401).json({
                    success: false,
                    message: "Teacher cannot add questions to this grade's level"
                });
                return;
            }
        }
    
        const question = await prisma.question.create({
            data: {
                questionTitle,
                difficulty,
                levelId
            }
        });

        res.status(201).json({
            success: true,
            question
        });

    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: "Internal server error when adding question"
        });
    }
}


const deleteQuestionHandler = async (req:Request,res:Response) => {
    try {
        const {questionId} = req.params as {questionId:string};
        const userId = req.userId;
    
        // complete this handler
        const user = await prisma.user.findUnique({where:{id:userId}});
        if(!user || user.role==="STUDENT") {
            res.status(401).json({
                "success":false,
                "message":"student cannot delete questions"
            })
            return;
        }
    
        const question = await prisma.question.findUnique({where:{id:questionId},include:{
            level:{
                select:{
                    subject:true,
                }
            }
        }});
        if(!question) {
            res.status(400).json({
                "success":false,
                "message":"question not found"
            })
            return;
        }
    
        if(user.role==="TEACHER") {
            const teachesGrade = await prisma.teacherGrade.findFirst({where:{teacherId:user.id,gradeId:question?.level.subject.gradeId}});
            if(!teachesGrade) {
                res.status(401).json({
                    "success":false,
                    "message":"teacher cannot delete question in this grade"
                })
                return;
            }
        }
    
        await prisma.question.delete({where:{id:question?.id}});
        res.status(200).json({
            "success":true,
            "message":`question deleted successfully`
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            "success":false,
            "message":"internal server error when deleting question"
        });
    }
}

const getQuestionWithAnswers = async (req:Request,res:Response) => {
    try {
        const {questionId} = req.params as {questionId:string};
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
            level:{
                select:{
                    subject:true,
                }
            }
        }});
        if(!question) {
            res.status(400).json({
                "success":false,
                "message":"question not found"
            });
            return;
        }
    
        const gradeId = question.level.subject.gradeId;
        
        if(user.role==="STUDENT" && user.gradeId!==gradeId) {
            res.status(401).json({
                "success":false,
                "message":"student cannot read questions for this grade"
            })
            return;
        }
    
        if(user.role==="TEACHER") {
            const teachesGrade = await prisma.teacherGrade.findFirst({where:{teacherId:user.id,gradeId:gradeId}});
            if(!teachesGrade) {
                
                res.status(401).json({
                    "success":false,
                    "message":"teacher cannot read questions for this grade"
                })
                
                return;
            }
        }
    
        const questionWithAnswers = await prisma.question.findUnique({where:{id:question.id},include:{
            Answers:true,
        }});

        const answers = user.role==="STUDENT" ? questionWithAnswers?.Answers.map((answer:Answer) => {
            return {
                id:answer.id,
                value:answer.value,
                questionId:answer.questionId,
            }
        }) : questionWithAnswers?.Answers;
        const response = {
            ...questionWithAnswers,
            "Answers":answers,
        }
        res.status(200).json({
            "success":true,
            "question":response,
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            "success":false,
            "message":"internal server error when getting question with its answers"
        });
    }
}


const getAnsweredQuestionsByLevelHandler = async (req:Request,res:Response) => {
    try {
        const {levelId} = req.params as {levelId:string};
        const userId = req.userId;
        
        // get questions which have questionResponses by the user with id=userId and is in the level
        const user = await prisma.user.findUnique({where:{id:userId}});
        if(!user) {
            res.status(400).json({
                "success":false,
                "message":"invalid user id"
            })    
            return;
        }
    
        const level = await prisma.level.findUnique({where:{id:levelId}});
        if(!level) {
            res.status(400).json({
                "success":false,
                "message":"level not found"
            });
            return;
        }
    
        // get questions which have responses by the user and in the level with id = level.id
        const answeredQuestions = await prisma.question.findMany({where:{
            levelId:level.id,
            QuestionResponse:{
                some:{
                    responderId:user.id,
                }
            }
        }});
    
        res.status(200).json({
            "success":true,
            "answeredQuestions":answeredQuestions,
        });
    
    } catch (error) {
        console.log(error);
        res.status(500).json({
            "success":false,
            "message":"internal server error when getting answered questions"
        });
    }
}

export  {
    getQuestionsByLevelHandler,
    addQuestionByLevelHandler,
    deleteQuestionHandler,
    getQuestionWithAnswers,
    getAnsweredQuestionsByLevelHandler,
}