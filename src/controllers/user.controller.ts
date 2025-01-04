import { Request, Response } from "express"
import { prisma } from "..";
import { User } from "@prisma/client";



const getTotalPointsHandler = async (req:Request,res:Response) => {
    try {
        const userId = req.userId;
        const user = await prisma.user.findUnique({where:{id:userId}});
        if(!user) {
            res.status(400).json({
                "success":false,
                "message":"invalid user id"
            })
            return;
        }
    
        const completedLevelsByUser = await prisma.userLevelComplete.findMany({where:{
            userId:user.id,
        }});
    
        let totalPointsEarnedByUser = 0;
        for(let i=0;i<completedLevelsByUser.length;i++) {
            totalPointsEarnedByUser += completedLevelsByUser[i].totalPoints;
        }
    
        res.status(200).json({
            "success":true,
            "totalPoints":totalPointsEarnedByUser,
        })
    } catch (error) {
        console.log(error);
        res.status(500).json({
            "success":false,
            "message":"internal server error when getting user points"
        });
    }
}

const getLeaderBoardHandler = async (req:Request,res:Response) => {
    try {
        const userId = req.userId;
        // ^ user making the request
        // we want rankings of the users that is in the same grade as the authenticated user
        const user = await prisma.user.findUnique({where:{id:userId}});
        if(!user) {
            res.status(400).json({
                "success":false,
                "message":"invalid user id"
            })
            return;
        }
    
        const gradeId = user.gradeId; // NEED USERS IN THIS GRADE ALONG WITH THEIR TOTAL POINTS
        const users = await prisma.user.findMany({where:{gradeId:gradeId},include:{
            UserLevelComplete:{
                select:{
                    totalPoints:true,
                }
            }
        }});
    
        type UserWithTotalPointsType = {
            user:User,
            totalPoints:number;
        }
    
        let usersWithTotalPoints:UserWithTotalPointsType[] = [];
    
        for(let i=0;i<users.length;i++) {
            let user = users[i];
            let sum = 0;
            for(let k = 0; k < user.UserLevelComplete.length;k++) {
                sum = sum + user.UserLevelComplete[k].totalPoints;
            }
    
    
            usersWithTotalPoints.push({
                user:{
                    email:user.email,
                    avatar:user.avatar,
                    createdAt:user.createdAt,
                    gradeId:user.gradeId,
                    id:user.id,
                    name:user.name,
                    password:user.password,
                    role:user.role,
                },
                totalPoints:sum,
            });
            // get total points for each user after the loop above
        }
    
        usersWithTotalPoints.sort((a,b) => b.totalPoints - a.totalPoints);

        res.status(200).json({
            "success":true,
            usersWithTotalPoints,
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({"success":false,"message":"internal server error when getting leaderboard"});
    }
}

export {
    getTotalPointsHandler,
    getLeaderBoardHandler,
}