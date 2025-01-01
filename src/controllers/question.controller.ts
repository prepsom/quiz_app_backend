import { Request, Response } from "express"
import { prisma } from "..";

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

export  {
    getQuestionsByLevelHandler,
    addQuestionByLevelHandler,
}