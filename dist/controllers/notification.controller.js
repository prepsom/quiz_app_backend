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
exports.addNotificationHandler = exports.updateNotificationHandler = exports.removeNotificationHandler = exports.getNotificationsHandler = void 0;
const __1 = require("..");
const getNotificationsHandler = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { gradeId } = req.params;
        const userId = req.userId;
        const { page, limit } = req.query;
        const user = yield __1.prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            res.status(400).json({
                success: false,
                message: "invalid user id"
            });
            return;
        }
        const grade = yield __1.prisma.grade.findUnique({ where: { id: gradeId } });
        if (!grade) {
            res.status(400).json({
                success: false,
                message: "grade not found"
            });
            return;
        }
        // check if user is part of this grade or a teacher for this grade 
        if (user.role === "STUDENT" && user.gradeId !== grade.id) {
            res.status(401).json({
                success: false,
                message: "user does not belong to this grade"
            });
            return;
        }
        if (user.role === "TEACHER") {
            const teachesGrade = yield __1.prisma.teacherGrade.findFirst({ where: { teacherId: user.id, gradeId: grade.id } });
            if (!teachesGrade) {
                res.status(401).json({
                    success: false,
                    message: "teacher cannot view notifications to this grade"
                });
                return;
            }
        }
        const pageNum = parseInt(page) || 1;
        const limitNum = parseInt(limit) || 10;
        const skip = pageNum * limitNum - limitNum;
        const notifications = yield __1.prisma.notification.findMany({
            where: {
                gradeId: grade.id,
            },
            orderBy: { createdAt: "desc" },
            skip: skip,
            take: limitNum,
        });
        const totalNotifications = yield __1.prisma.notification.count({
            where: { gradeId: grade.id }
        });
        const totalPages = Math.ceil(totalNotifications / limitNum);
        res.status(200).json({
            success: true,
            notifications,
            totalPages,
        });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: "internal server error" });
    }
});
exports.getNotificationsHandler = getNotificationsHandler;
const removeNotificationHandler = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { notificationId } = req.params;
        const userId = req.userId;
        const user = yield __1.prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            res.status(400).json({ success: false, message: "invalid user id" });
            return;
        }
        if (user.role === "STUDENT") {
            res.status(401).json({ success: false, message: "unauthorized to remove notification" });
            return;
        }
        const notification = yield __1.prisma.notification.findUnique({ where: { id: notificationId } });
        if (!notification) {
            res.status(400).json({ success: false, message: "invalid notification id" });
            return;
        }
        const notificationGrade = notification.gradeId;
        if (user.role === "TEACHER") {
            // CHECK IF TEACHER TEACHES THE GRADE THE NOTIFICATION BELONGS TO 
            const teachesGrade = yield __1.prisma.teacherGrade.findFirst({ where: { teacherId: user.id, gradeId: notificationGrade } });
            if (!teachesGrade) {
                res.status(401).json({ success: false, message: "unauthorized to remove notification" });
                return;
            }
        }
        yield __1.prisma.notification.delete({ where: { id: notification.id } });
        res.status(200).json({ success: true, message: "notification removed successfully" });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: "internal server error" });
    }
});
exports.removeNotificationHandler = removeNotificationHandler;
const updateNotificationHandler = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { notificationId } = req.params;
        const userId = req.userId;
        const { message } = req.body;
        const user = yield __1.prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            res.status(400).json({ success: false, message: "invalid user id" });
            return;
        }
        if (user.role === "STUDENT") {
            res.status(401).json({ success: false, message: "unauthorized to remove notification" });
            return;
        }
        const notification = yield __1.prisma.notification.findUnique({ where: { id: notificationId } });
        if (!notification) {
            res.status(400).json({ success: false, message: "invalid notification id" });
            return;
        }
        const notificationGrade = notification.gradeId;
        if (user.role === "TEACHER") {
            // CHECK IF TEACHER TEACHES THE GRADE THE NOTIFICATION BELONGS TO 
            const teachesGrade = yield __1.prisma.teacherGrade.findFirst({ where: { teacherId: user.id, gradeId: notificationGrade } });
            if (!teachesGrade) {
                res.status(401).json({ success: false, message: "unauthorized to remove notification" });
                return;
            }
        }
        const newNotificaiton = yield __1.prisma.notification.update({
            where: {
                id: notification.id
            },
            data: {
                message: message,
            }
        });
        res.status(200).json({ success: true, message: "updated notification", notification: newNotificaiton });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: "internal server error" });
    }
});
exports.updateNotificationHandler = updateNotificationHandler;
const addNotificationHandler = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { gradeId } = req.params;
        const { message } = req.body;
        const userId = req.userId;
        const user = yield __1.prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            res.status(400).json({ success: false, message: "invalid user id" });
            return;
        }
        const grade = yield __1.prisma.grade.findUnique({ where: { id: gradeId } });
        if (!grade) {
            res.status(400).json({ success: false, message: "invalid grade id" });
            return;
        }
        if (user.role === "STUDENT") {
            res.status(401).json({ success: false, message: "unauthorized to add notification" });
            return;
        }
        if (user.role === "TEACHER") {
            const teachesGrade = yield __1.prisma.teacherGrade.findFirst({ where: { teacherId: user.id, gradeId: grade.id } });
            if (!teachesGrade) {
                res.status(400).json({
                    success: false,
                    message: "Unauthorized to add notification"
                });
                return;
            }
        }
        const notification = yield __1.prisma.notification.create({
            data: {
                message: message.trim(),
                gradeId: grade.id,
            }
        });
        res.status(200).json({ success: true, message: "added notification", notification });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: "internal server error" });
    }
});
exports.addNotificationHandler = addNotificationHandler;
