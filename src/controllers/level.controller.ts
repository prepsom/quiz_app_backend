import { Request, Response } from "express";
import { prisma } from "..";
import { $Enums, Question } from "@prisma/client";


type AddLevelRequestBody = {
    levelName:string;
    subjectId:string;
}

type UpdateLevelRequestBody = {
    newLevelName:string;
}


const addLevelHandler = async (req:Request,res:Response) =>  {
    // who can add levels -> teachers 
    try {
        const userId = req.userId;
        const {levelName,subjectId} = req.body as AddLevelRequestBody;
        const user = await prisma.user.findUnique({where:{id:userId}});
        
        if(!user || user.role==="STUDENT") {
            res.status(400).json({
                "success":false,
                "message":"invalid user id"
            })
            return;
        }
    
        const subject = await prisma.subject.findUnique({where:{id:subjectId}});
        if (!subject) {
            res.status(400).json({
                success: false,
                message: "Invalid subject ID",
            });
            return;
        }
    
        // CAN ONLY ADD A LEVEL IF THE TEACHER TEACHES THE GRADE WHICH HAS  THE SUBJECT HE/SHE IS ADDING A LEVEL TO
        if(user.role==="TEACHER") {
            const teachesGrade = await prisma.teacherGrade.findFirst({where:{teacherId:user.id,gradeId:subject.gradeId}});
            if(!teachesGrade) {
                res.status(401).json({
                    "success":false,
                    "message":"teacher cannot add level in this subject"
                })
                return;
            }
        }
    
        // teacher can add a level 
        const highestPosition = await prisma.level.findMany({where:{subjectId:subject.id},orderBy:{
            position:"desc"
        },take:1}).then(levels => levels[0]?.position ?? -1);
    
        const newLevel = await prisma.level.create({data:{
            levelName:levelName,
            position:highestPosition+1,
            subjectId:subject.id
        }});
    
    
        res.status(201).json({
            success: true,
            message: "Level added successfully",
            level: newLevel,
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            "success":false,
            "message":"Intenral server error when adding a level"
        });
    }
}



const getLevelsBySubjectHandler = async (req:Request,res:Response) => {
    try {
        const {subjectId} = req.params as {subjectId:string};
        const userId = req.userId;
    
        const user = await prisma.user.findUnique({where:{id:userId}});
        if(!user) {
            return;
        }
    
        const subject = await prisma.subject.findUnique({where:{id:subjectId}});
        if(!subject) {
            return;
        }
    
        // subject exists to get levels for that subject 
        // can only read levels if
        // if user student then the grade that the subject is in has to match user's grade
        // if user is teacher then teacher has to teach the grade that the subject is in 
        if(user.role==="STUDENT") {
            if(user.gradeId !== subject.gradeId) {
                res.status(401).json({
                    "success":false,
                    "message":""
                })
                return;
            }   
        }
    
    
        if(user.role==="TEACHER") {
            const teachesGrade = await prisma.teacherGrade.findFirst({where:{teacherId:user.id,gradeId:subject.gradeId}});
            if(!teachesGrade) {
                res.status(401).json({
                    "success":false,
                    "message":"teacher cannot read levels of this subject"
                })
                return;
            }
        }

        const levels = await prisma.level.findMany({where:{subjectId:subject.id},orderBy:{position:"asc"}});

        res.status(200).json({
            "success":true,
            levels,
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            "success":false,
            "message":"internal server error when fetching levels for a subject"
        })
    }
}

const deleteLevelHandler = async (req:Request,res:Response) => {
    try {
        const {levelId} = req.params as {levelId:string};
        const userId = req.userId;
    
        const user = await prisma.user.findUnique({where:{id:userId}});
        if (!user || user.role==="STUDENT") {
            res.status(401).json({
                success: false,
                message: "Unauthorized user.",
            });
            return;
        }
    
        const level = await prisma.level.findUnique({ where: { id: levelId },include:{subject:true}});
        if (!level) {
            res.status(404).json({
                success: false,
                message: "Level not found.",
            });
            return;
        }    
    
        const gradeId = level.subject.gradeId; // grade in which the level is in 
    
        if(user.role==="TEACHER") {
            const teachesGrade = await prisma.teacherGrade.findFirst({where:{teacherId:user.id,gradeId:gradeId}});
            if(!teachesGrade) {
                res.status(401).json({
                    success: false,
                    message: "Teacher is not authorized to delete levels of this subject.",
                });
                return;
            }
        }
    
        await prisma.level.delete({where:{id:level.id}});
        res.status(200).json({
            success: true,
            message: "Level deleted successfully.",
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: "Internal server error while deleting the level.",
        });
    }
}

const updateLevelHandler = async (req:Request,res:Response) => {
    try {
        const {levelId} = req.params as {levelId:string};
        const {newLevelName} = req.body as UpdateLevelRequestBody;
        const userId = req.userId;
    
        // complete this update level handler
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user || user.role === "STUDENT") {
            res.status(401).json({
                success: false,
                message: "Unauthorized user.",
            });
            return;
        }
    
        const level = await prisma.level.findUnique({
            where: { id: levelId },
            include: { subject: true },
        });
        if (!level) {
            res.status(404).json({
                success: false,
                message: "Level not found.",
            });
            return;
        }
    
        const gradeId = level.subject.gradeId; // Grade in which the level is present
        if (user.role === "TEACHER") {
            const teachesGrade = await prisma.teacherGrade.findFirst({
                where: { teacherId: user.id, gradeId },
            });
            if (!teachesGrade) {
                res.status(403).json({
                    success: false,
                    message: "Teacher is not authorized to update levels of this subject.",
                });
                return;
            }
        }
    
        const updatedLevel = await prisma.level.update({
            where: { id: level.id },
            data: { levelName: newLevelName.trim()},
        });
    
        res.status(200).json({
            success: true,
            message: "Level updated successfully.",
            level: updatedLevel,
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            "success":false,
            "message":"Internal server error while updating the level"
        })
    }
}
type LevelResult = {
    totalPoints: number;
    correctAnswers: number;
    totalQuestions: number;
    questionResults: {
        question: {
            id: string;
            questionTitle: string;
            questionHint: string | null;
            difficulty: $Enums.Difficulty;
            levelId: string;
            ready: boolean;
        };
        isCorrect: boolean;
        pointsEarned: number;
        responseTime: number;
    }[];
}

const getLevelResultsHandler = async (req:Request,res:Response) => {
    try {
        const {levelId} = req.params as {levelId:string};
        const userId = req.userId;
    
        // get results for questions answered in a level by the user 
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
    
        const responses = await prisma.questionResponse.findMany({
            where:{
                 responderId:user.id,
                 question:{
                    levelId:level.id,
                 }
            },
            include:{
                question:true,
            }
        });
    
        if(responses.length===0) {
            res.status(404).json({
                "success":false,
                "message":"No results found for this level"
            });
            return;
        }
        
        const result:LevelResult = {
            totalPoints:responses.reduce((sum,r) => sum + r.pointsEarned,0),
            correctAnswers:responses.filter(r => r.isCorrect).length,
            totalQuestions:responses.length,
            questionResults:responses.map((r => {
                return {
                    question:r.question,
                    isCorrect:r.isCorrect,
                    pointsEarned:r.pointsEarned,
                    responseTime:r.responseTime
                }
            }))
        };
    
        res.status(200).json({
            success: true,
            result
        });
    } catch (error) {
        console.error("Error in getLevelResultsHandler:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error when fetching level results"
        });
    }
}

export {
    addLevelHandler,
    getLevelsBySubjectHandler,
    deleteLevelHandler,
    updateLevelHandler,
    getLevelResultsHandler,
}