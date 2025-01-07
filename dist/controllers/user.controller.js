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
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLeaderBoardHandler = exports.getTotalPointsHandler = void 0;
const __1 = require("..");
const getTotalPointsHandler = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.userId;
        const user = yield __1.prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            res.status(400).json({
                "success": false,
                "message": "invalid user id"
            });
            return;
        }
        const completedLevelsByUser = yield __1.prisma.userLevelComplete.findMany({ where: {
                userId: user.id,
            } });
        let totalPointsEarnedByUser = 0;
        for (let i = 0; i < completedLevelsByUser.length; i++) {
            totalPointsEarnedByUser += completedLevelsByUser[i].totalPoints;
        }
        res.status(200).json({
            "success": true,
            "totalPoints": totalPointsEarnedByUser,
        });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({
            "success": false,
            "message": "internal server error when getting user points"
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
                "success": false,
                "message": "invalid user id"
            });
            return;
        }
        const gradeId = user.gradeId; // NEED USERS IN THIS GRADE ALONG WITH THEIR TOTAL POINTS
        const users = yield __1.prisma.user.findMany({ where: { gradeId: gradeId }, include: {
                UserLevelComplete: {
                    select: {
                        totalPoints: true,
                    }
                }
            } });
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
            "success": true,
            usersWithTotalPoints,
            "noOfPages": Math.ceil(users.length / limitNum),
        });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ "success": false, "message": "internal server error when getting leaderboard" });
    }
});
exports.getLeaderBoardHandler = getLeaderBoardHandler;
