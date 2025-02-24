import {Request,Response} from "express"
import { prisma } from "..";


const getNotificationsHandler = async (req:Request,res:Response) => {
    try {
        const {gradeId} = req.params as {gradeId:string};
        const userId = req.userId;
        const {page,limit} = req.query as {page:string;limit:string};


        const user = await prisma.user.findUnique({where:{id:userId}});
        if(!user) {
            res.status(400).json({
                success:false,
                message:"invalid user id"
            });
            return;
        }
    
        const grade = await prisma.grade.findUnique({where:{id:gradeId}});
        if(!grade) {
            res.status(400).json({
                success:false,
                message:"grade not found"
            });
            return;
        }

        // check if user is part of this grade or a teacher for this grade 
        if(user.role==="STUDENT" && user.gradeId!==grade.id) {
            res.status(401).json({
                success:false,
                message:"user does not belong to this grade"
            });
            return;
        }

        if(user.role==="TEACHER") {
            const teachesGrade = await prisma.teacherGrade.findFirst({where:{teacherId:user.id,gradeId:grade.id}});
            if(!teachesGrade) {
                res.status(401).json({
                    success:false,
                    message:"teacher cannot view notifications to this grade"
                });
                return;
            }
        }

        const pageNum = parseInt(page) || 1;
        const limitNum = parseInt(limit) || 10;

        const skip = pageNum * limitNum - limitNum;

        const notifications = await prisma.notification.findMany({
            where:{
                gradeId:grade.id,
            },
            orderBy:{createdAt:"desc"},
            skip:skip,
            take:limitNum,
        });

        const totalNotifications = await prisma.notification.count({
            where:{gradeId:grade.id}
        });
        const totalPages = Math.ceil(totalNotifications / limitNum);

        res.status(200).json({
            success:true,
            notifications,
            totalPages,
        });
    
    } catch (error) {
        console.log(error);
        res.status(500).json({success:false,message:"internal server error"});        
    }
}

const removeNotificationHandler = async (req:Request,res:Response) => {
    try {
        const {notificationId} = req.params as {notificationId:string};
        const userId = req.userId;
    
        const user = await prisma.user.findUnique({where:{id:userId}});
        if(!user) {
            res.status(400).json({success:false,message:"invalid user id"});
            return;
        }
    
        if(user.role==="STUDENT") {
            res.status(401).json({success:false,message:"unauthorized to remove notification"});
            return;
        }
    
        const notification = await prisma.notification.findUnique({where:{id:notificationId}});
        if(!notification) {
            res.status(400).json({success:false,message:"invalid notification id"});
            return;
        }
    
        const notificationGrade = notification.gradeId;
        if(user.role==="TEACHER") {
            // CHECK IF TEACHER TEACHES THE GRADE THE NOTIFICATION BELONGS TO 
            const teachesGrade = await prisma.teacherGrade.findFirst({where:{teacherId:user.id,gradeId:notificationGrade}});
            if(!teachesGrade) {
                res.status(401).json({success:false,message:"unauthorized to remove notification"});
                return;
            }
        }
    
    
        await prisma.notification.delete({where:{id:notification.id}});
        res.status(200).json({success:true,message:"notification removed successfully"});
    
    } catch (error) {
        console.log(error);
        res.status(500).json({success:false,message:"internal server error"});        
    }
}

const updateNotificationHandler = async (req:Request,res:Response) => {
    try {
        const {notificationId} = req.params as {notificationId:string};
        const userId = req.userId;
        const {message} = req.body as {message:string};
    
        const user = await prisma.user.findUnique({where:{id:userId}});
        if(!user) {
            res.status(400).json({success:false,message:"invalid user id"});
            return;
        }
    
        if(user.role==="STUDENT") {
            res.status(401).json({success:false,message:"unauthorized to remove notification"});
            return;
        }
    
        const notification = await prisma.notification.findUnique({where:{id:notificationId}});
        if(!notification) {
            res.status(400).json({success:false,message:"invalid notification id"});
            return;
        }
    
        const notificationGrade = notification.gradeId;
        if(user.role==="TEACHER") {
            // CHECK IF TEACHER TEACHES THE GRADE THE NOTIFICATION BELONGS TO 
            const teachesGrade = await prisma.teacherGrade.findFirst({where:{teacherId:user.id,gradeId:notificationGrade}});
            if(!teachesGrade) {
                res.status(401).json({success:false,message:"unauthorized to remove notification"});
                return;
            }
        }
    
        const newNotificaiton = await prisma.notification.update({
            where:{
                id:notification.id
            },
            data:{
                message:message,
            }
        });
    
        res.status(200).json({success:true,message:"updated notification",notification:newNotificaiton});
    
    } catch (error) {
        console.log(error);
        res.status(500).json({success:false,message:"internal server error"});        
    }
}

const addNotificationHandler = async (req:Request,res:Response) => {
    try {
        const {gradeId} = req.params as {gradeId:string};
        const {message} = req.body as {message:string};
        const userId = req.userId;

        const user = await prisma.user.findUnique({where:{id:userId}});
        if(!user) {
            res.status(400).json({success:false,message:"invalid user id"});
            return;
        }

        const grade = await prisma.grade.findUnique({where:{id:gradeId}});
        if(!grade) {
            res.status(400).json({success:false,message:"invalid grade id"});
            return;
        }

        if(user.role==="STUDENT") {
            res.status(401).json({success:false,message:"unauthorized to add notification"});
            return;
        }

        if(user.role==="TEACHER") {
            const teachesGrade = await prisma.teacherGrade.findFirst({where:{teacherId:user.id,gradeId:grade.id}});
            if(!teachesGrade) {
                res.status(400).json({
                    success:false,
                    message:"Unauthorized to add notification"
                });
                return;
            }
        }

        const notification = await prisma.notification.create({
            data:{
                message:message.trim(),
                gradeId:grade.id,
            }
        });
        res.status(200).json({success:true,message:"added notification",notification});
    } catch (error) {
        console.log(error);
        res.status(500).json({success:false,message:"internal server error"});
    }
}

export {
    getNotificationsHandler,
    removeNotificationHandler,
    updateNotificationHandler,
    addNotificationHandler,
}