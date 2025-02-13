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
exports.getNotificationsHandler = exports.getStudentsByGradeIdHandler = exports.getGradeByIdHandler = void 0;
const __1 = require("..");
const getGradeByIdHandler = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { gradeId } = req.params;
        const grade = yield __1.prisma.grade.findUnique({ where: { id: gradeId } });
        if (!grade) {
            res.status(404).json({ success: false, message: "Grade not found" });
            return;
        }
        res.status(200).json({ success: true, message: "Grade found", grade });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
});
exports.getGradeByIdHandler = getGradeByIdHandler;
const getStudentsByGradeIdHandler = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { gradeId } = req.params;
        const userId = req.userId;
        // there can be like 100 students in a grade
        // so pagination is required
        const { page, limit, filterByNameOrEmail, sortByTotalPoints } = req.query;
        const pageNum = parseInt(page) || 1;
        const limitNum = parseInt(limit) || 10;
        const skip = pageNum * limitNum - limitNum;
        const isFilterByEmailOrName = filterByNameOrEmail !== undefined ? true : false;
        const isSortByUsersTotalPoints = sortByTotalPoints !== undefined ? true : false;
        const user = yield __1.prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            res.status(404).json({ success: false, message: "User not found" });
            return;
        }
        const grade = yield __1.prisma.grade.findUnique({ where: { id: gradeId } });
        if (!grade) {
            res.status(404).json({ success: false, message: "Grade not found" });
            return;
        }
        if (user.role === "STUDENT") {
            res.status(401).json({ success: false, message: "You are not authorized to access this resource" });
            return;
        }
        // if the role is teacher then the teacher has to belong to this grade
        if (user.role === "TEACHER") {
            const teachesGrade = yield __1.prisma.teacherGrade.findFirst({ where: { teacherId: user.id, gradeId: grade.id } });
            if (!teachesGrade) {
                res.status(401).json({ success: false, message: "You are not authorized to access this resource" });
                return;
            }
            // authorized to access the students in this grade
        }
        // pagination happens first then filtering and sorting is happening after pagination 
        // ideally , filtering and sorting should happen first then pagination should happen
        // fetch all students with filter and sort then paginate
        let students = yield __1.prisma.user.findMany({ where: { gradeId: grade.id }, include: {
                UserLevelComplete: {
                    select: {
                        totalPoints: true,
                    }
                }
            } });
        let studentsWithTotalPoints;
        // sort the students by total points 
        // each student has multiple levels completed and total points for each level complete
        // so we need to go through each student and calculate their total points and then sort them
        // SORT THE STUDENTS BY TOTAL POINTS 
        if (isSortByUsersTotalPoints) {
            studentsWithTotalPoints = students.map((student) => {
                let totalPoints = 0;
                for (const completedLevel of student.UserLevelComplete) {
                    totalPoints = totalPoints + completedLevel.totalPoints;
                }
                return Object.assign(Object.assign({}, student), { totalPoints: totalPoints });
            });
            sortByTotalPoints === "desc" ? studentsWithTotalPoints.sort((a, b) => b.totalPoints - a.totalPoints) : studentsWithTotalPoints.sort((a, b) => a.totalPoints - b.totalPoints);
            students = studentsWithTotalPoints;
        }
        // once all students are sorted by total points if isSortByUsersTotalPoints is true
        // we need to filter the students by name or email if isFilterByEmailOrName is true
        if (isFilterByEmailOrName) {
            students = students.filter((student) => { var _a; return student.email.includes(filterByNameOrEmail.trim().toLowerCase()) || ((_a = student.name) === null || _a === void 0 ? void 0 : _a.trim().toLowerCase().includes(filterByNameOrEmail.trim().toLowerCase())); });
        }
        // sorted and filtered students are paginated 
        // using skip and limit 
        // the current students array is already sorted and filtered
        let totalStudents = students.length;
        let totalPages = Math.ceil(totalStudents / limitNum);
        students = students.slice(skip, skip + limitNum);
        // skip = 10 and // limit = 10 so 
        res.status(200).json({ success: true, students, totalPages, page: pageNum, limit: limitNum });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: "internal server error" });
    }
});
exports.getStudentsByGradeIdHandler = getStudentsByGradeIdHandler;
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
