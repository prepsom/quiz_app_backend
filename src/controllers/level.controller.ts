import { Request, Response } from "express";
import { prisma } from "..";


type AddLevelRequestBody = {
    levelName:string;
    subjectId:string;
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

export {
    addLevelHandler,
    getLevelsBySubjectHandler,
}