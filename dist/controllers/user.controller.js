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
        usersWithTotalPoints.sort((a, b) => b.totalPoints - a.totalPoints);
        res.status(200).json({
            "success": true,
            usersWithTotalPoints,
        });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ "success": false, "message": "internal server error when getting leaderboard" });
    }
});
exports.getLeaderBoardHandler = getLeaderBoardHandler;
