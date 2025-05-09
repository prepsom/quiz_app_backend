import { Request, Response } from "express";
import { prisma } from "..";
import { User } from "@prisma/client";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { sendResetPasswordMail } from "../utils/sendResetPasswordMail";
import { compareAsc } from "date-fns";

const getTotalPointsHandler = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      res.status(400).json({
        success: false,
        message: "invalid user id",
      });
      return;
    }

    const completedLevelsByUser = await prisma.userLevelComplete.findMany({
      where: {
        userId: user.id,
      },
    });

    let totalPointsEarnedByUser = 0;
    for (let i = 0; i < completedLevelsByUser.length; i++) {
      totalPointsEarnedByUser += completedLevelsByUser[i].totalPoints;
    }

    res.status(200).json({
      success: true,
      totalPoints: totalPointsEarnedByUser,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "internal server error when getting user points",
    });
  }
};

const getLeaderBoardHandler = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    const { limit, page } = req.query as { page: string; limit: string };
    const limitNum = parseInt(limit) || 10;
    const pageNum = parseInt(page) || 1;

    // ^ user making the request
    // we want rankings of the users that is in the same grade as the authenticated user
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      res.status(400).json({
        success: false,
        message: "invalid user id",
      });
      return;
    }

    const gradeId = user.gradeId; // NEED USERS IN THIS GRADE ALONG WITH THEIR TOTAL POINTS
    const users = await prisma.user.findMany({
      where: { gradeId: gradeId },
      include: {
        UserLevelComplete: {
          select: {
            totalPoints: true,
          },
        },
      },
    });

    type UserWithTotalPointsType = {
      user: User;
      totalPoints: number;
    };

    let usersWithTotalPoints: UserWithTotalPointsType[] = [];

    for (let i = 0; i < users.length; i++) {
      let user = users[i];
      let sum = 0;
      for (let k = 0; k < user.UserLevelComplete.length; k++) {
        sum = sum + user.UserLevelComplete[k].totalPoints;
      }

      usersWithTotalPoints.push({
        user: {
          email: user.email,
          avatar: user.avatar,
          createdAt: user.createdAt,
          gradeId: user.gradeId,
          id: user.id,
          name: user.name,
          password: user.password,
          role: user.role,
          lastLogin: user.lastLogin,
          schoolName: user.schoolName,
          phoneNumber: user.phoneNumber,
          hashedToken: user.hashedToken,
          tokenExpirationDate: user.tokenExpirationDate,
        },
        totalPoints: sum,
      });
      // get total points for each user after the loop above
    }

    // here we have the array with users and its total points with no regard for order or limit

    usersWithTotalPoints.sort((a, b) => b.totalPoints - a.totalPoints);

    // after ther users array with total points has been sorted
    // we trim it down even more with the pageNum and limitNum

    // example page 1 and limit 10
    let newTestArr = [];
    const skip = pageNum * limitNum - limitNum; // no of elements to skip
    let noOfElements = 0;
    for (let i = 0; i < usersWithTotalPoints.length; i++) {
      if (i < skip) continue;
      if (i >= skip) {
        newTestArr.push(usersWithTotalPoints[i]);
        noOfElements++;
      }
      if (noOfElements === limitNum) {
        break;
      }
    }
    usersWithTotalPoints = newTestArr;
    res.status(200).json({
      success: true,
      usersWithTotalPoints,
      noOfPages: Math.ceil(users.length / limitNum),
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "internal server error when getting leaderboard",
    });
  }
};

const isUserPasswordCorrect = async (req: Request, res: Response) => {
  try {
    const { password } = req.body as { password: string };
    const userId = req.userId;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      res.status(400).json({
        success: false,
        message: "invalid user id",
      });
      return;
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    res.status(200).json({
      success: true,
      isPasswordCorrect: isPasswordCorrect,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "internal server error when checking user password",
    });
  }
};

const updateUserNameHandler = async (req: Request, res: Response) => {
  try {
    const { newName } = req.body as { newName: string };
    const userId = req.userId;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      res.status(400).json({
        success: false,
        message: "invalid user id",
      });
      return;
    }
    if (newName.trim() === "" || newName.length < 3) {
      res.status(400).json({
        success: false,
        message: "new name has to have atleast 3 characters",
      });
      return;
    }

    const newUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        name: newName.trim(),
      },
    });

    res.status(200).json({
      sucess: true,
      newUser,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "internal server error when updating user name",
    });
  }
};

const updateUserPasswordHandler = async (req: Request, res: Response) => {
  try {
    const { newPassword, currentPassword } = req.body as {
      currentPassword: string;
      newPassword: string;
    };
    const userId = req.userId;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      res.status(400).json({
        success: false,
        message: "invalid user id",
      });
      return;
    }

    const isCurrentPasswordCorrect = await bcrypt.compare(
      currentPassword,
      user.password
    );
    if (!isCurrentPasswordCorrect) {
      res.status(400).json({
        success: false,
        message: "incorrect current password",
      });
      return;
    }

    // validate password
    if (!validatePassword(newPassword)) {
      res.status(400).json({
        success: false,
        message: "password is weak",
      });
      return;
    }

    // hash new password
    const salts = await bcrypt.genSalt(10);
    const newHashedPassword = await bcrypt.hash(newPassword.trim(), salts);

    await prisma.user.update({
      where: { id: user.id },
      data: { password: newHashedPassword },
    });
    res.status(200).json({
      success: true,
      message: "password updated successfully",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "internal server error when updating password",
    });
  }
};

const forgotPasswordHandler = async (req: Request, res: Response) => {
  try {
    const { email } = req.body as { email: string };
    if (!email.trim()) {
      res.status(400).json({ success: false, message: "email is required" });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    });
    if (!user) {
      res
        .status(400)
        .json({ success: false, message: "user with email not found" });
      return;
    }

    // generate a token
    // hash the token and store in db for the current user with the expiration date
    // send a reset url link with the token to the email
    const token = crypto.randomBytes(20).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const resetPasswordUrl = `${process.env.CLIENT_URL}/reset-password/${token}`;
    const tokenExpirationDateTime = Date.now() + 15 * (1000 * 60);

    // save the hashed token and expiration date in the db for the particular user
    await prisma.user.update({
      where: { id: user.id },
      data: {
        hashedToken: hashedToken,
        tokenExpirationDate: new Date(tokenExpirationDateTime),
      },
    });

    // send reset password email with the resetUrlLink to the user's email
    await sendResetPasswordMail(email.trim().toLowerCase(), resetPasswordUrl);
    res.status(200).json({
      success: true,
      message: "forgot password email sent successfully",
      email: email.trim().toLowerCase(),
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const resetPasswordHandler = async (req: Request, res: Response) => {
  try {
    const { newPassword, token } = req.body as {
      newPassword: string;
      token: string;
    };

    // validate new password
    if (!validatePassword(newPassword.trim())) {
      res.status(400).json({ success: false, message: "weak password" });
      return;
    }

    const newHashedToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");
    // check if user with the hashed token exists
    const user = await prisma.user.findFirst({
      where: { hashedToken: newHashedToken },
    });
    if (!user) {
      res.status(400).json({ success: false, message: "invalid token" });
      return;
    }

    const tokenExpirationDate = user.tokenExpirationDate;
    if (!tokenExpirationDate) {
      res.status(500).json({
        success: false,
        message: "reset password token expiration date error",
      });
      return;
    }
    const currentDate = new Date();

    if (compareAsc(currentDate, tokenExpirationDate) === 1) {
      res.status(400).json({ success: false, message: "link expired" });
      return;
    }
    // compareAsc(currentDate,tokeExpirationDate) was 0 or -1 here i.e currentDate was the same or before the expiration date
    // hash the new password and update it
    const salt = await bcrypt.genSalt(10);
    const newHashedPassword = await bcrypt.hash(newPassword.trim(), salt);
    const newUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        password: newHashedPassword,
        hashedToken: null,
        tokenExpirationDate: null,
      },
    });
    res
      .status(200)
      .json({ success: true, message: "password resetted succecsfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "internal server error",
    });
  }
};


const getUserByIdHandler = async (req:Request,res:Response) => {
  try {
    const {userId} = req.params as {userId:string};
    const authenticatedUserId = req.userId;
    const {page,limit,filterBySubjectId} = req.query as {page:string;limit:string;filterBySubjectId:string};
    // filter completed levels of a user by subject ... 

    const authenticatedUser = await prisma.user.findUnique({where:{id:authenticatedUserId}});
    if(!authenticatedUser) {
      res.status(400).json({success:false,message:"invalid user id"});
      return;
    }

    // if the user that we are trying to get data of is not a student then return error

    const user = await prisma.user.findUnique({where:{id:userId}});
    if(!user) {
      res.status(400).json({success:false,message:"invalid user id"});
      return;
    }

    if(user.role==="TEACHER" || user.role==="ADMIN") {
      res.status(400).json({success:false,message:"cannot get data of a teacher or admin"});
      return;
    }

    // if a authenticated user is making a request to get another user's data then 
    // the authenticated user is either an admin or the user itself or the teacher but the teacher should teach the grade the user is in 

    if(authenticatedUser.role==="STUDENT" && authenticatedUser.id!==user.id) {
      res.status(401).json({success:false,message:"unauthorized"});
      return;
    }


    if(authenticatedUser.role==="TEACHER") {
      const userGrade = user.gradeId;
      const isAuthenticatedUserTeachingThisGrade = await prisma.teacherGrade.findFirst({where:{teacherId:authenticatedUser.id,gradeId:userGrade!}});
      if(!isAuthenticatedUserTeachingThisGrade) {
        res.status(401).json({success:false,message:"unauthorized"});
        return;
      }
    }

    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;

    const skip = pageNum * limitNum - limitNum;

    let userCompletedLevels;
    let totalLevels:number = 0;

    // get user data and the levels completed by the user along with the totalPoints and strengths,weaknesses and recommendations
    if(filterBySubjectId!==undefined) {
      const filterSubject = await prisma.subject.findUnique({where:{id:filterBySubjectId}});
      if(!filterSubject) {
        res.status(400).json({success:false,message:"subject to filter completed levels by not found"});
        return;
      }

      userCompletedLevels = await prisma.userLevelComplete.findMany({
        where:{
          userId:user.id,
        },
        include:{
          level:{
            include:{
              subject:true,
            }
          }
        }
      });

      userCompletedLevels = userCompletedLevels.filter((completedLevel) => completedLevel.level.subject.id===filterSubject.id);
      // after filtered by subject
      // paginate
      totalLevels = userCompletedLevels.length;
      userCompletedLevels = userCompletedLevels.slice(skip,skip + limitNum);

    } else {
      userCompletedLevels = await prisma.userLevelComplete.findMany({where:{userId:user.id},include:{
        level:{
          include:{
            subject:true,
          }
        }
      },skip:skip,take:limitNum});

      totalLevels = await prisma.userLevelComplete.count({
        where:{
          userId:user.id,
        }
      });
    }

    const totalPages = Math.ceil(totalLevels/limitNum);

    let userTotalPoints = 0;
    let allCompletedLevels = await prisma.userLevelComplete.findMany({
      where:{
        userId:user.id
      }
    });
    for(const completedLevel of allCompletedLevels) {
      userTotalPoints = userTotalPoints + completedLevel.totalPoints;
    }

    res.status(200).json({
      success:true,
      userData:user,
      userCompletedLevels:userCompletedLevels,
      totalPoints:userTotalPoints,
      totalPages:totalPages,
    });

  } catch (error) {
    console.log(error);
    res.status(500).json({success:false,message:"internal server error when getting user data"});
  }
}

const getUserTotalPointsHandler = async (req:Request,res:Response) => {
  try {
        // get users total points
    const {userId} = req.params as {userId:string};
    const authenticatedUserId = req.userId;

    const authenticatedUser = await prisma.user.findUnique({where:{id:authenticatedUserId}});
    if(!authenticatedUser) {
      res.status(400).json({success:false,message:"invalid user id"});
      return;
    }

    const user = await prisma.user.findUnique({where:{id:userId}});
    if(!user) {
      res.status(400).json({success:false,message:"invalid user id"});
      return;
    }

    // if the user is a student then it can only get its own total points 
    if(authenticatedUser.role==="STUDENT" && authenticatedUser.id!==user.id) {
      res.status(401).json({success:false,message:"unauthorized"});
      return;
    }

    // if the user is a teacher then the teacher can get the user's total points if the teacher teaches the grade the user is in 
    if(authenticatedUser.role==="TEACHER") {
      const userGrade = user.gradeId;
      const isAuthenticatedUserTeachingThisGrade = await prisma.teacherGrade.findFirst({where:{teacherId:authenticatedUser.id,gradeId:userGrade!}});
      if(!isAuthenticatedUserTeachingThisGrade) {
        res.status(401).json({success:false,message:"unauthorized"});
        return;
      }
    }


    // get the user's total points
    let userTotalPoints = 0;
    const completedLevels = await prisma.userLevelComplete.findMany({where:{userId:user.id}});

    for(const completedLevel of completedLevels) {
      userTotalPoints = userTotalPoints + completedLevel.totalPoints;
    }


    res.status(200).json({success:true,totalPoints:userTotalPoints});

  } catch (error) {
    console.log(error);
    res.status(500).json({success:false,message:"Internal server error"});    
  }
}

const getTeacherGradesHandler = async (req:Request,res:Response) => {
  try {
        // the authenitcated user should be a teacher 
    // get the grades the teacher teaches 
    const userId = req.userId;

    const teacher = await prisma.user.findUnique({where:{id:userId}});
    if(!teacher) {
      res.status(400).json({success:false,message:"invalid teacher id"});
      return;
    }

    if(teacher.role==="STUDENT" || teacher.role==="ADMIN") {
      res.status(400).json({success:false,message:"unauthorized"});
      return;
    }

    const teacherGrades = await prisma.teacherGrade.findMany({where:{teacherId:teacher.id},include:{
      grade:{
        include:{
          _count:{
            select:{
              students:true,
            }
          }
        }
      },
    }});

    const grades = teacherGrades.map((teacherGrade) => {
      return {
        gradeId:teacherGrade.gradeId,
        grade:teacherGrade.grade.grade,
        noOfStudents:teacherGrade.grade._count.students,
      }
    });

    res.status(200).json({success:true,grades});

  } catch (error) {
    console.log(error);
    res.status(500).json({success:false,message:"internal server error when getting teacher grades"});    
  }
}


const validatePassword = (password: string): boolean => {
  // password requirements
  // need to have atleast 6 characters
  // need to have atleast 1 special character
  // need to have atleast 1 number
  // need to have atleast 1 uppercase char
  if (password.length < 6) return false;

  const specialChars = "@#$%&!";
  const numbers = "0123456789";
  const upperCaseChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

  let hasSpecialChar = false;
  for (const specialChar of specialChars) {
    for (let i = 0; i < password.length; i++) {
      if (password.charAt(i) === specialChar) {
        hasSpecialChar = true;
        break;
      }
    }

    if (hasSpecialChar) break;
  }

  if (!hasSpecialChar) return false;

  let hasNumber = false;
  for (const number of numbers) {
    if (password.includes(number)) {
      hasNumber = true;
      break;
    }
  }

  if (!hasNumber) return false;

  let hasUppercase = false;

  for (const upperCaseChar of upperCaseChars) {
    if (password.includes(upperCaseChar)) {
      hasUppercase = true;
      break;
    }
  }

  if (!hasUppercase) return false;

  return true;
};

export {
  getTotalPointsHandler,
  getLeaderBoardHandler,
  isUserPasswordCorrect,
  updateUserNameHandler,
  updateUserPasswordHandler,
  forgotPasswordHandler,
  resetPasswordHandler,
  getUserByIdHandler,
  getUserTotalPointsHandler,
  getTeacherGradesHandler,
};
