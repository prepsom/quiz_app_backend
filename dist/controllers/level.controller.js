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
exports.updateLevelHandler = exports.deleteLevelHandler = exports.getLevelsBySubjectHandler = exports.addLevelHandler = void 0;
const __1 = require("..");
const addLevelHandler = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // who can add levels -> teachers 
    try {
        const userId = req.userId;
        const { levelName, subjectId } = req.body;
        const user = yield __1.prisma.user.findUnique({ where: { id: userId } });
        if (!user || user.role === "STUDENT") {
            res.status(400).json({
                "success": false,
                "message": "invalid user id"
            });
            return;
        }
        const subject = yield __1.prisma.subject.findUnique({ where: { id: subjectId } });
        if (!subject) {
            res.status(400).json({
                success: false,
                message: "Invalid subject ID",
            });
            return;
        }
        // CAN ONLY ADD A LEVEL IF THE TEACHER TEACHES THE GRADE WHICH HAS  THE SUBJECT HE/SHE IS ADDING A LEVEL TO
        if (user.role === "TEACHER") {
            const teachesGrade = yield __1.prisma.teacherGrade.findFirst({ where: { teacherId: user.id, gradeId: subject.gradeId } });
            if (!teachesGrade) {
                res.status(401).json({
                    "success": false,
                    "message": "teacher cannot add level in this subject"
                });
                return;
            }
        }
        // teacher can add a level 
        const highestPosition = yield __1.prisma.level.findMany({ where: { subjectId: subject.id }, orderBy: {
                position: "desc"
            }, take: 1 }).then(levels => { var _a, _b; return (_b = (_a = levels[0]) === null || _a === void 0 ? void 0 : _a.position) !== null && _b !== void 0 ? _b : -1; });
        const newLevel = yield __1.prisma.level.create({ data: {
                levelName: levelName,
                position: highestPosition + 1,
                subjectId: subject.id
            } });
        res.status(201).json({
            success: true,
            message: "Level added successfully",
            level: newLevel,
        });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({
            "success": false,
            "message": "Intenral server error when adding a level"
        });
    }
});
exports.addLevelHandler = addLevelHandler;
const getLevelsBySubjectHandler = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { subjectId } = req.params;
        const userId = req.userId;
        const user = yield __1.prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            return;
        }
        const subject = yield __1.prisma.subject.findUnique({ where: { id: subjectId } });
        if (!subject) {
            return;
        }
        // subject exists to get levels for that subject 
        // can only read levels if
        // if user student then the grade that the subject is in has to match user's grade
        // if user is teacher then teacher has to teach the grade that the subject is in 
        if (user.role === "STUDENT") {
            if (user.gradeId !== subject.gradeId) {
                res.status(401).json({
                    "success": false,
                    "message": ""
                });
                return;
            }
        }
        if (user.role === "TEACHER") {
            const teachesGrade = yield __1.prisma.teacherGrade.findFirst({ where: { teacherId: user.id, gradeId: subject.gradeId } });
            if (!teachesGrade) {
                res.status(401).json({
                    "success": false,
                    "message": "teacher cannot read levels of this subject"
                });
                return;
            }
        }
        const levels = yield __1.prisma.level.findMany({ where: { subjectId: subject.id }, orderBy: { position: "asc" } });
        res.status(200).json({
            "success": true,
            levels,
        });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({
            "success": false,
            "message": "internal server error when fetching levels for a subject"
        });
    }
});
exports.getLevelsBySubjectHandler = getLevelsBySubjectHandler;
const deleteLevelHandler = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { levelId } = req.params;
        const userId = req.userId;
        const user = yield __1.prisma.user.findUnique({ where: { id: userId } });
        if (!user || user.role === "STUDENT") {
            res.status(401).json({
                success: false,
                message: "Unauthorized user.",
            });
            return;
        }
        const level = yield __1.prisma.level.findUnique({ where: { id: levelId }, include: { subject: true } });
        if (!level) {
            res.status(404).json({
                success: false,
                message: "Level not found.",
            });
            return;
        }
        const gradeId = level.subject.gradeId; // grade in which the level is in 
        if (user.role === "TEACHER") {
            const teachesGrade = yield __1.prisma.teacherGrade.findFirst({ where: { teacherId: user.id, gradeId: gradeId } });
            if (!teachesGrade) {
                res.status(401).json({
                    success: false,
                    message: "Teacher is not authorized to delete levels of this subject.",
                });
                return;
            }
        }
        yield __1.prisma.level.delete({ where: { id: level.id } });
        res.status(200).json({
            success: true,
            message: "Level deleted successfully.",
        });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: "Internal server error while deleting the level.",
        });
    }
});
exports.deleteLevelHandler = deleteLevelHandler;
const updateLevelHandler = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { levelId } = req.params;
        const { newLevelName } = req.body;
        const userId = req.userId;
        // complete this update level handler
        const user = yield __1.prisma.user.findUnique({ where: { id: userId } });
        if (!user || user.role === "STUDENT") {
            res.status(401).json({
                success: false,
                message: "Unauthorized user.",
            });
            return;
        }
        const level = yield __1.prisma.level.findUnique({
            where: { id: levelId },
            include: { subject: true },
        });
        if (!level) {
            res.status(404).json({
                success: false,
                message: "Level not found.",
            });
            return;
        }
        const gradeId = level.subject.gradeId; // Grade in which the level is present
        if (user.role === "TEACHER") {
            const teachesGrade = yield __1.prisma.teacherGrade.findFirst({
                where: { teacherId: user.id, gradeId },
            });
            if (!teachesGrade) {
                res.status(403).json({
                    success: false,
                    message: "Teacher is not authorized to update levels of this subject.",
                });
                return;
            }
        }
        const updatedLevel = yield __1.prisma.level.update({
            where: { id: level.id },
            data: { levelName: newLevelName.trim() },
        });
        res.status(200).json({
            success: true,
            message: "Level updated successfully.",
            level: updatedLevel,
        });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({
            "success": false,
            "message": "Internal server error while updating the level"
        });
    }
});
exports.updateLevelHandler = updateLevelHandler;
