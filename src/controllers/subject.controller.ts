import { Request, Response } from "express";
import { prisma } from "..";

type AddSubjectRequestBody = {
    subjectName:string;
    gradeId:string;
}

type UpdateSubjectRequestBody = {
    newSubjectName:string;
}

const getSubjectsByGradeHandler = async (req:Request,res:Response) => {
    // get auth userid from middleware
    // get user with the grade he/she is in 
    // once we have the grade , we fetch for the subjects by the grade
    // return subjects
    try {
        const {gradeId} = req.params as {gradeId:string};
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

        const grade = await prisma.grade.findUnique({where:{id:gradeId}});
        if(!grade)  {
            res.status(400).json({
                "success":false,
                "message":"invalid grade id"
            });
            return;
        }

        // endpoint to get subjects under a specific grade
        // if the user is a student and if belongs to the grade then show the subjects
        // if the user is a teacher and if teaches the grade then show the subjects
        if(user.role==="STUDENT") {
            if(user.gradeId!==grade.id) {
                res.status(401).json({
                    "success":false,
                    "message":"user unauthorized to get subjects under this grade"
                })
                return;
            }
        }

        if(user.role==="TEACHER") {
            const teachesGrade = await prisma.teacherGrade.findFirst({where:{teacherId:user.id,gradeId:grade.id}});
            if(!teachesGrade) {
                res.status(401).json({
                    "success":false,
                    "message":"teacher unauthorized to get subjects under this grade"
                })
                return;
            }
        }

        const subjects = await prisma.subject.findMany({where:{gradeId:grade.id}});
        
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
    
    // if role== teacher   , check if teacher teaches that grade they are trying to add a subject to

    const {gradeId,subjectName} = req.body as AddSubjectRequestBody

    if(subjectName.trim()==="") {
        res.status(400).json({
            "success":false,
            "message":"subject name cannot be empty"
        })
        return;
    }

    const grade = await prisma.grade.findUnique({where:{id:gradeId}});
    if(!grade) {
        res.status(404).json({
            "success":false,
            "message":"grade not found"
        });
        return;
    }

    // check if role===TEACHER that teacher teaches this grade , if he/she doesn't then can't add subject in this grade
    if(user.role==="TEACHER") {
        const teacherGrade = await prisma.teacherGrade.findFirst({where:{teacherId:user.id,gradeId:grade.id}});
        if(!teacherGrade) {
            res.status(401).json({
                "success":false,
                "message":"teacher doesn't teach this grade. unauthorized to add a subject"
            });
            return;
        }
    }

    const newSubject = await prisma.subject.create({data:{subjectName:subjectName.trim(),gradeId:grade.id}});

    await prisma.notification.create({
        data:{
            gradeId:newSubject.gradeId,
            message:`${newSubject.subjectName} subject added!`
        }
    })

    res.status(201).json({
        "success":true,
        "subject":newSubject,
    });
    } catch (error) {
       console.log(error);
       res.status(500).json({"success":false,"message":"internal server error when adding subject"}); 
    }
}

const deleteSubjectHandler = async (req:Request,res:Response) => {
    try {
    const {subjectId} = req.params as {subjectId:string};
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

    if(user.role==="STUDENT") {
        res.status(401).json({
            "success":false,
            "message":"user not authorized to delete subjects"
        })
        return;
    }

    // if role == teacher then if teacher teaches the grade that this subject is in then its ok for the teacher to delete the subject

    const subject = await prisma.subject.findUnique({where:{id:subjectId}});
    if(!subject) {
        res.status(400).json({
            "success":false,
            "message":"subject not found"
        });
        return;
    }

    if(user.role==="TEACHER") {
        const subjectGradeId = subject.gradeId;
        const teachesGrade = await prisma.teacherGrade.findFirst({where:{teacherId:user.id,gradeId:subjectGradeId}});
        if (!teachesGrade) {
            res.status(401).json({
                "success":false,
                "message":"teacher doesn't teach this grade. unauthorized to delete a subject"
            })
            return;
        }
    }

    await prisma.subject.delete({where:{id:subject.id}});
    res.status(200).json({
        "success":true,
        "message":"subject deleted successfully"
    });
    
} catch (error) {
        console.log(error); 
    }
}


const updateSubjectHandler = async (req:Request,res:Response) => {
    try {
        const userId = req.userId;
        const {subjectId} = req.params as {subjectId:string};
        const {newSubjectName} = req.body as UpdateSubjectRequestBody;
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

        if(newSubjectName.trim()==="") {
            res.status(400).json({
                "success":false,
                "message":"subject name cannot be empty"
            })
            return;
        }

        const subject = await prisma.subject.findUnique({where:{id:subjectId}});
        if(!subject) {
            res.status(400).json({
                "success":false,
                "message":"subject not found"
            });
            return;
        }
    
        // subject to update available 
        if(user.role==="STUDENT") {
            res.status(400).json({
                "success":false,
                "message":"student not authorized to update subject"
            })
            return;
        }
    
        if(user.role==="TEACHER") {
            // If teacher teaches the grade that the subject is in then it is ok if not then return err
            const teachesGrade = await prisma.teacherGrade.findFirst({where:{teacherId:user.id,gradeId:subject.gradeId}});
            if(!teachesGrade) {
                res.status(401).json({
                    "success":false,
                    "message":"teacher not allowed to update subject of this grade"
                });
                return;
            }
        }
    
        const updatedSubject = await prisma.subject.update({where:{id:subject.id},data:{subjectName:newSubjectName.trim()}});
        res.status(200).json({
            "success":true,
            "message":"subject updated successfully",
            "subject":updatedSubject,
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            "success":false,
            "message":"Internal server error when updating subject"
        });
    }
}

const getSubjectById = async (req:Request,res:Response) => {
    try {
        const {subjectId} = req.params as {subjectId:string};
        const subject = await prisma.subject.findUnique({where:{id:subjectId}});
        if(!subject) {
            res.status(400).json({
                "success":false,
                "message":"subject not found"
            });
            return;
        }
    
        res.status(200).json({"success":true,subject});
    } catch (error) {
        console.log(error);
        res.status(500).json({
            "success":false,
            "message":"internal server error when getting subject"
        })
    }
}

export {
    getSubjectsByGradeHandler,
    addSubjectByGradeHandler,
    deleteSubjectHandler,
    updateSubjectHandler,
    getSubjectById,
}