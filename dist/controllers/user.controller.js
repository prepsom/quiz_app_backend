"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTeacherGradesHandler = exports.getUserTotalPointsHandler = exports.getUserByIdHandler = exports.resetPasswordHandler = exports.forgotPasswordHandler = exports.updateUserPasswordHandler = exports.updateUserNameHandler = exports.isUserPasswordCorrect = exports.getLeaderBoardHandler = exports.getTotalPointsHandler = void 0;
const __1 = require("..");
const bcrypt_1 = __importDefault(require("bcrypt"));
const crypto_1 = __importDefault(require("crypto"));
const sendResetPasswordMail_1 = require("../utils/sendResetPasswordMail");
const date_fns_1 = require("date-fns");
const getTotalPointsHandler = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.userId;
        const user = yield __1.prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            res.status(400).json({
                success: false,
                message: "invalid user id",
            });
            return;
        }
        const completedLevelsByUser = yield __1.prisma.userLevelComplete.findMany({
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
    }
    catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: "internal server error when getting user points",
        });
    }
});
exports.getTotalPointsHandler = getTotalPointsHandler;
const getLeaderBoardHandler = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.userId;
        const { limit, page } = req.query;
        const limitNum = parseInt(limit) || 10;
        const pageNum = parseInt(page) || 1;
        // ^ user making the request
        // we want rankings of the users that is in the same grade as the authenticated user
        const user = yield __1.prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            res.status(400).json({
                success: false,
                message: "invalid user id",
            });
            return;
        }
        const gradeId = user.gradeId; // NEED USERS IN THIS GRADE ALONG WITH THEIR TOTAL POINTS
        const users = yield __1.prisma.user.findMany({
            where: { gradeId: gradeId },
            include: {
                UserLevelComplete: {
                    select: {
                        totalPoints: true,
                    },
                },
            },
        });
        let usersWithTotalPoints = [];
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
            if (i < skip)
                continue;
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
    }
    catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: "internal server error when getting leaderboard",
        });
    }
});
exports.getLeaderBoardHandler = getLeaderBoardHandler;
const isUserPasswordCorrect = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { password } = req.body;
        const userId = req.userId;
        const user = yield __1.prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            res.status(400).json({
                success: false,
                message: "invalid user id",
            });
            return;
        }
        const isPasswordCorrect = yield bcrypt_1.default.compare(password, user.password);
        res.status(200).json({
            success: true,
            isPasswordCorrect: isPasswordCorrect,
        });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: "internal server error when checking user password",
        });
    }
});
exports.isUserPasswordCorrect = isUserPasswordCorrect;
const updateUserNameHandler = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { newName } = req.body;
        const userId = req.userId;
        const user = yield __1.prisma.user.findUnique({ where: { id: userId } });
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
        const newUser = yield __1.prisma.user.update({
            where: { id: user.id },
            data: {
                name: newName.trim(),
            },
        });
        res.status(200).json({
            sucess: true,
            newUser,
        });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: "internal server error when updating user name",
        });
    }
});
exports.updateUserNameHandler = updateUserNameHandler;
const updateUserPasswordHandler = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { newPassword, currentPassword } = req.body;
        const userId = req.userId;
        const user = yield __1.prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            res.status(400).json({
                success: false,
                message: "invalid user id",
            });
            return;
        }
        const isCurrentPasswordCorrect = yield bcrypt_1.default.compare(currentPassword, user.password);
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
        const salts = yield bcrypt_1.default.genSalt(10);
        const newHashedPassword = yield bcrypt_1.default.hash(newPassword.trim(), salts);
        yield __1.prisma.user.update({
            where: { id: user.id },
            data: { password: newHashedPassword },
        });
        res.status(200).json({
            success: true,
            message: "password updated successfully",
        });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: "internal server error when updating password",
        });
    }
});
exports.updateUserPasswordHandler = updateUserPasswordHandler;
const forgotPasswordHandler = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email } = req.body;
        if (!email.trim()) {
            res.status(400).json({ success: false, message: "email is required" });
            return;
        }
        const user = yield __1.prisma.user.findUnique({
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
        const token = crypto_1.default.randomBytes(20).toString("hex");
        const hashedToken = crypto_1.default.createHash("sha256").update(token).digest("hex");
        const resetPasswordUrl = `${process.env.CLIENT_URL}/reset-password/${token}`;
        const tokenExpirationDateTime = Date.now() + 15 * (1000 * 60);
        // save the hashed token and expiration date in the db for the particular user
        yield __1.prisma.user.update({
            where: { id: user.id },
            data: {
                hashedToken: hashedToken,
                tokenExpirationDate: new Date(tokenExpirationDateTime),
            },
        });
        // send reset password email with the resetUrlLink to the user's email
        yield (0, sendResetPasswordMail_1.sendResetPasswordMail)(email.trim().toLowerCase(), resetPasswordUrl);
        res.status(200).json({
            success: true,
            message: "forgot password email sent successfully",
            email: email.trim().toLowerCase(),
        });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
});
exports.forgotPasswordHandler = forgotPasswordHandler;
const resetPasswordHandler = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { newPassword, token } = req.body;
        // validate new password
        if (!validatePassword(newPassword.trim())) {
            res.status(400).json({ success: false, message: "weak password" });
            return;
        }
        const newHashedToken = crypto_1.default
            .createHash("sha256")
            .update(token)
            .digest("hex");
        // check if user with the hashed token exists
        const user = yield __1.prisma.user.findFirst({
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
        if ((0, date_fns_1.compareAsc)(currentDate, tokenExpirationDate) === 1) {
            res.status(400).json({ success: false, message: "link expired" });
            return;
        }
        // compareAsc(currentDate,tokeExpirationDate) was 0 or -1 here i.e currentDate was the same or before the expiration date
        // hash the new password and update it
        const salt = yield bcrypt_1.default.genSalt(10);
        const newHashedPassword = yield bcrypt_1.default.hash(newPassword.trim(), salt);
        const newUser = yield __1.prisma.user.update({
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
    }
    catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: "internal server error",
        });
    }
});
exports.resetPasswordHandler = resetPasswordHandler;
const getUserByIdHandler = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId } = req.params;
        const authenticatedUserId = req.userId;
        const authenticatedUser = yield __1.prisma.user.findUnique({ where: { id: authenticatedUserId } });
        if (!authenticatedUser) {
            res.status(400).json({ success: false, message: "invalid user id" });
            return;
        }
        // if the user that we are trying to get data of is not a student then return error
        const user = yield __1.prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            res.status(400).json({ success: false, message: "invalid user id" });
            return;
        }
        if (user.role === "TEACHER" || user.role === "ADMIN") {
            res.status(400).json({ success: false, message: "cannot get data of a teacher or admin" });
            return;
        }
        // if a authenticated user is making a request to get another user's data then 
        // the authenticated user is either an admin or the user itself or the teacher but the teacher should teach the grade the user is in 
        if (authenticatedUser.role === "STUDENT" && authenticatedUser.id !== user.id) {
            res.status(401).json({ success: false, message: "unauthorized" });
            return;
        }
        if (authenticatedUser.role === "TEACHER") {
            const userGrade = user.gradeId;
            const isAuthenticatedUserTeachingThisGrade = yield __1.prisma.teacherGrade.findFirst({ where: { teacherId: authenticatedUser.id, gradeId: userGrade } });
            if (!isAuthenticatedUserTeachingThisGrade) {
                res.status(401).json({ success: false, message: "unauthorized" });
                return;
            }
        }
        // get user data and the levels completed by the user along with the totalPoints and strengths,weaknesses and recommendations
        const userCompletedLevels = yield __1.prisma.userLevelComplete.findMany({ where: { userId: user.id }, include: {
                level: {
                    include: {
                        subject: true,
                    }
                }
            } });
        let userTotalPoints = 0;
        for (const eachCompletedLevel of userCompletedLevels) {
            userTotalPoints = userTotalPoints + eachCompletedLevel.totalPoints;
        }
        res.status(200).json({
            success: true,
            userData: user,
            userCompletedLevels: userCompletedLevels,
            totalPoints: userTotalPoints
        });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: "internal server error when getting user data" });
    }
});
exports.getUserByIdHandler = getUserByIdHandler;
const getUserTotalPointsHandler = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // get users total points
        const { userId } = req.params;
        const authenticatedUserId = req.userId;
        const authenticatedUser = yield __1.prisma.user.findUnique({ where: { id: authenticatedUserId } });
        if (!authenticatedUser) {
            res.status(400).json({ success: false, message: "invalid user id" });
            return;
        }
        const user = yield __1.prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            res.status(400).json({ success: false, message: "invalid user id" });
            return;
        }
        // if the user is a student then it can only get its own total points 
        if (authenticatedUser.role === "STUDENT" && authenticatedUser.id !== user.id) {
            res.status(401).json({ success: false, message: "unauthorized" });
            return;
        }
        // if the user is a teacher then the teacher can get the user's total points if the teacher teaches the grade the user is in 
        if (authenticatedUser.role === "TEACHER") {
            const userGrade = user.gradeId;
            const isAuthenticatedUserTeachingThisGrade = yield __1.prisma.teacherGrade.findFirst({ where: { teacherId: authenticatedUser.id, gradeId: userGrade } });
            if (!isAuthenticatedUserTeachingThisGrade) {
                res.status(401).json({ success: false, message: "unauthorized" });
                return;
            }
        }
        // get the user's total points
        let userTotalPoints = 0;
        const completedLevels = yield __1.prisma.userLevelComplete.findMany({ where: { userId: user.id } });
        for (const completedLevel of completedLevels) {
            userTotalPoints = userTotalPoints + completedLevel.totalPoints;
        }
        res.status(200).json({ success: true, totalPoints: userTotalPoints });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
});
exports.getUserTotalPointsHandler = getUserTotalPointsHandler;
const getTeacherGradesHandler = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // the authenitcated user should be a teacher 
        // get the grades the teacher teaches 
        const userId = req.userId;
        const teacher = yield __1.prisma.user.findUnique({ where: { id: userId } });
        if (!teacher) {
            res.status(400).json({ success: false, message: "invalid teacher id" });
            return;
        }
        if (teacher.role === "STUDENT" || teacher.role === "ADMIN") {
            res.status(400).json({ success: false, message: "unauthorized" });
            return;
        }
        const teacherGrades = yield __1.prisma.teacherGrade.findMany({ where: { teacherId: teacher.id }, include: {
                grade: {
                    include: {
                        _count: {
                            select: {
                                students: true,
                            }
                        }
                    }
                },
            } });
        const grades = teacherGrades.map((teacherGrade) => {
            return {
                gradeId: teacherGrade.gradeId,
                grade: teacherGrade.grade.grade,
                noOfStudents: teacherGrade.grade._count.students,
            };
        });
        res.status(200).json({ success: true, grades });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: "internal server error when getting teacher grades" });
    }
});
exports.getTeacherGradesHandler = getTeacherGradesHandler;
const validatePassword = (password) => {
    // password requirements
    // need to have atleast 6 characters
    // need to have atleast 1 special character
    // need to have atleast 1 number
    // need to have atleast 1 uppercase char
    if (password.length < 6)
        return false;
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
        if (hasSpecialChar)
            break;
    }
    if (!hasSpecialChar)
        return false;
    let hasNumber = false;
    for (const number of numbers) {
        if (password.includes(number)) {
            hasNumber = true;
            break;
        }
    }
    if (!hasNumber)
        return false;
    let hasUppercase = false;
    for (const upperCaseChar of upperCaseChars) {
        if (password.includes(upperCaseChar)) {
            hasUppercase = true;
            break;
        }
    }
    if (!hasUppercase)
        return false;
    return true;
};
