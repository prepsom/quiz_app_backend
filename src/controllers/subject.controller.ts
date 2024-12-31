import { Request, Response } from "express";
import { prisma } from "..";

type AddSubjectRequestBody = {
    subjectName:string;
    gradeId:string;
}


const getSubjectsByGradeHandler = async (req:Request,res:Response) => {
    // get auth userid from middleware
    // get user with the grade he/she is in 
    // once we have the grade , we fetch for the subjects by the grade
    // return subjects
    try {
        const userId = req.userId;
        if(!userId)  {
            res.status(401).json({
                "success":false,
                "message":'authenticated user id not found'
            })
            return;
        }
        const user = await prisma.user.findUnique({where:{id:userId}});
        if(!user) {
            res.status(400).json({
                "success":false,
                "message":"invalid user id"
            })
            return;
        }
    
        const subjects = await prisma.subject.findMany({where:{gradeId:user?.gradeId}});
        res.status(200).json({
            "success":true,
            subjects,
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            "success":false,
            "message":"Internal server error when getting subjects"
        })
    }
}

const addSubjectByGradeHandler = async (req:Request,res:Response) => {
    try {
            // get userId from req (added by middleware) to get the auth user id 
    const userId = req.userId;
    if(!userId)  {
        res.status(401).json({
            "success":false,
            "message":'authenticated user id not found'
        })
        return;
    }
    const user = await prisma.user.findUnique({where:{id:userId}});
    if(!user) {
        res.status(400).json({
            "success":false,
            "message":"invalid user id"
        })
        return;
    }

    // check role of the user - either ADMIN OR TEACHER
    if(user.role==="STUDENT") {
        res.status(401).json({
            "success":false,
            "message":"user not authorized to create a subject"
        });
        return;   
    }
    const {gradeId,subjectName} = req.body as AddSubjectRequestBody

    const grade = await prisma.grade.findUnique({where:{id:gradeId}});
    if(!grade) {
        res.status(404).json({
            "success":false,
            "message":"grade not found"
        });
        return;
    }

    const newSubject = await prisma.subject.create({data:{subjectName:subjectName.trim(),gradeId:grade.id}});
    res.status(201).json({
        "success":true,
        "subject":newSubject,
    });
    } catch (error) {
       console.log(error);
       res.status(500).json({"success":false,"message":"internal server error when adding subject"}); 
    }
}

export {
    getSubjectsByGradeHandler,
    addSubjectByGradeHandler,
}