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
exports.getTotalPointsHandler = void 0;
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
