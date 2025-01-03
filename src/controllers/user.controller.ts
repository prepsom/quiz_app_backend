import { Request, Response } from "express"
import { prisma } from "..";



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

export {
    getTotalPointsHandler,
}