import { Request, Response } from "express"
import { prisma } from "..";
import { User } from "@prisma/client";

import bcrypt from "bcrypt"

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
        const {limit,page} = req.query as {page:string,limit:string};
        const limitNum = parseInt(limit) || 10;
        const pageNum = parseInt(page) || 1;

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
                    lastLogin:user.lastLogin,
                },
                totalPoints:sum,
            });
            // get total points for each user after the loop above
        }
    
        // here we have the array with users and its total points with no regard for order or limit

        usersWithTotalPoints.sort((a,b) => b.totalPoints - a.totalPoints);
        

        // after ther users array with total points has been sorted
        // we trim it down even more with the pageNum and limitNum 

        // example page 1 and limit 10 
        let newTestArr = [];
        const skip = pageNum * limitNum - limitNum; // no of elements to skip 
        let noOfElements = 0;
        for(let i=0;i<usersWithTotalPoints.length;i++) {
            if(i < skip) continue;
            if(i >= skip) {
                newTestArr.push(usersWithTotalPoints[i]);
                noOfElements++;
            }
            if(noOfElements===limitNum) {
                break;
            }
        }
        usersWithTotalPoints = newTestArr;
        res.status(200).json({
            "success":true,
            usersWithTotalPoints,
            "noOfPages": Math.ceil(users.length / limitNum),
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({"success":false,"message":"internal server error when getting leaderboard"});
    }
}

const isUserPasswordCorrect = async (req:Request,res:Response) => {
    try {
        const {password} = req.body as {"password":string};
        const userId = req.userId;
    
        const user = await prisma.user.findUnique({where:{id:userId}});
        if(!user) {
            res.status(400).json({
                "success":false,
                "message":"invalid user id"
            })
            return;
        }
    
        const isPasswordCorrect = await bcrypt.compare(password,user.password);
        res.status(200).json({
            "success":true,
            "isPasswordCorrect":isPasswordCorrect,
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({"success":false,"message":"internal server error when checking user password"});
    }

}


const updateUserNameHandler = async (req:Request,res:Response) => {
    try {
        const {newName} = req.body as {"newName":string};
        const userId = req.userId;
    
        const user = await prisma.user.findUnique({where:{id:userId}});
        if(!user) {
            res.status(400).json({
                "success":false,
                "message":"invalid user id"
            });
            return;
        }
        if(newName.trim()==="" || newName.length < 3) {
            res.status(400).json({
                "success":false,
                "message":"new name has to have atleast 3 characters"
            })
            return;
        }
    
        const newUser = await prisma.user.update({where:{id:user.id},data:{
            name:newName.trim(),
        }});
    
        res.status(200).json({
            "sucess":true,
            newUser,
        })
    } catch (error) {
        console.log(error);
        res.status(500).json({
            "success":false,
            "message":"internal server error when updating user name"
        });
    }
}

const updateUserPasswordHandler = async (req:Request,res:Response) => {
    try {
        const {newPassword} = req.body as {newPassword:string};
        const userId = req.userId;
        const user = await prisma.user.findUnique({where:{id:userId}});
        if(!user) {
            res.status(400).json({
                "success":false,
                "message":"invalid user id"
            });
            return;
        }
    
        // validate password
        if(!validatePassword(newPassword)) {
            res.status(400).json({
                "success":false,
                "message":"password is weak"
            })
            return;
        }
    
        // hash new password
        const salts = await bcrypt.genSalt(10);
        const newHashedPassword = await bcrypt.hash(newPassword.trim(),salts);
    
        await prisma.user.update({where:{id:user.id},data:{password:newHashedPassword}});
        res.status(200).json({
            "success":true,
            "message":"password updated successfully"
        })
    } catch (error) {
        console.log(error);
        res.status(500).json({
            "success":false,
            "message":"internal server error when updating password"
        });
    }
}

const validatePassword = (password:string):boolean => {

    // password requirements 
    // need to have atleast 6 characters
    // need to have atleast 1 special character
    // need to have atleast 1 number 
    // need to have atleast 1 uppercase char
    if(password.length < 6) return false;

    const specialChars = "@#$%&!";
    const numbers = "0123456789";
    const upperCaseChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

    let hasSpecialChar = false;
    for(const specialChar of specialChars) {

        for(let i=0;i<password.length;i++) {
            if(password.charAt(i)===specialChar) {
                hasSpecialChar=true;
                break;
            }
        }

        if(hasSpecialChar) break;
    }
    
    if(!hasSpecialChar) return false;

    let hasNumber = false;
    for(const number of numbers) {

        if(password.includes(number)) {
            hasNumber=true;
            break;
        }
    }

    if(!hasNumber) return false;

    let hasUppercase = false;

    for(const upperCaseChar of upperCaseChars) {

        if(password.includes(upperCaseChar)) {
            hasUppercase=true;
            break;
        }

    }


    if(!hasUppercase) return false;

    return true;
}

export {
    getTotalPointsHandler,
    getLeaderBoardHandler,
    isUserPasswordCorrect,
    updateUserNameHandler,
    updateUserPasswordHandler,
}