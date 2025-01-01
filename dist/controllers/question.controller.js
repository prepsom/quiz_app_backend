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
exports.getQuestionWithAnswers = exports.deleteQuestionHandler = exports.addQuestionByLevelHandler = exports.getQuestionsByLevelHandler = void 0;
const __1 = require("..");
const getQuestionsByLevelHandler = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // levelId and userId
    try {
        const { levelId } = req.params;
        const userId = req.userId;
        const user = yield __1.prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            res.status(400).json({
                "success": false,
                "message": "invalid user id"
            });
            return;
        }
        const level = yield __1.prisma.level.findUnique({ where: { id: levelId }, include: {
                subject: true,
            } });
        if (!level) {
            res.status(400).json({
                "success": false,
                "message": "invalid level id"
            });
            return;
        }
        // level exists so can get questions under a level
        // if the user is a student then to see questions under a level
        // student has to be in the same grade the level is in 
        const gradeId = level.subject.gradeId;
        if (user.role === "STUDENT" && user.gradeId !== gradeId) {
            res.status(401).json({
                "success": false,
                "message": "user cannot access questions for this level"
            });
            return;
        }
        // user is part of this grade here 
        if (user.role === "TEACHER") {
            // teacher teaches this grade that the questions are in then its cool
            const teachesGrade = yield __1.prisma.teacherGrade.findFirst({ where: { teacherId: user.id, gradeId: gradeId } });
            if (!teachesGrade) {
                res.status(401).json({
                    "success": false,
                    "message": "teacher cannot view questions of this grade"
                });
                return;
            }
        }
        const questions = yield __1.prisma.question.findMany({ where: { levelId: level.id } });
        res.status(200).json({
            "success": true,
            questions,
        });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({
            "success": false,
            "message": "internal server error when getting questions for a level"
        });
    }
});
exports.getQuestionsByLevelHandler = getQuestionsByLevelHandler;
const addQuestionByLevelHandler = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { difficulty, levelId, questionTitle } = req.body;
        const userId = req.userId;
        const user = yield __1.prisma.user.findUnique({ where: { id: userId } });
        if (!user || user.role == "STUDENT") {
            res.status(401).json({
                success: false,
                message: "Only teachers can add questions"
            });
            return;
        }
        const level = yield __1.prisma.level.findUnique({
            where: { id: levelId },
            include: {
                subject: true,
            }
        });
        if (!level) {
            res.status(400).json({
                success: false,
                message: "Invalid level id"
            });
            return;
        }
        if (user.role === "TEACHER") {
            const teacherGrade = yield __1.prisma.teacherGrade.findFirst({
                where: {
                    teacherId: userId,
                    gradeId: level.subject.gradeId
                }
            });
            if (!teacherGrade) {
                res.status(401).json({
                    success: false,
                    message: "Teacher cannot add questions to this grade's level"
                });
                return;
            }
        }
        const question = yield __1.prisma.question.create({
            data: {
                questionTitle,
                difficulty,
                levelId
            }
        });
        res.status(201).json({
            success: true,
            question
        });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: "Internal server error when adding question"
        });
    }
});
exports.addQuestionByLevelHandler = addQuestionByLevelHandler;
const deleteQuestionHandler = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { questionId } = req.params;
        const userId = req.userId;
        // complete this handler
        const user = yield __1.prisma.user.findUnique({ where: { id: userId } });
        if (!user || user.role === "STUDENT") {
            res.status(401).json({
                "success": false,
                "message": "student cannot delete questions"
            });
            return;
        }
        const question = yield __1.prisma.question.findUnique({ where: { id: questionId }, include: {
                level: {
                    select: {
                        subject: true,
                    }
                }
            } });
        if (!question) {
            res.status(400).json({
                "success": false,
                "message": "question not found"
            });
            return;
        }
        if (user.role === "TEACHER") {
            const teachesGrade = yield __1.prisma.teacherGrade.findFirst({ where: { teacherId: user.id, gradeId: question === null || question === void 0 ? void 0 : question.level.subject.gradeId } });
            if (!teachesGrade) {
                res.status(401).json({
                    "success": false,
                    "message": "teacher cannot delete question in this grade"
                });
                return;
            }
        }
        yield __1.prisma.question.delete({ where: { id: question === null || question === void 0 ? void 0 : question.id } });
        res.status(200).json({
            "success": true,
            "message": `question deleted successfully`
        });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({
            "success": false,
            "message": "internal server error when deleting question"
        });
    }
});
exports.deleteQuestionHandler = deleteQuestionHandler;
const getQuestionWithAnswers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { questionId } = req.params;
        const userId = req.userId;
        const user = yield __1.prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            res.status(400).json({
                "success": false,
                "message": "invalid user id"
            });
            return;
        }
        const question = yield __1.prisma.question.findUnique({ where: { id: questionId }, include: {
                level: {
                    select: {
                        subject: true,
                    }
                }
            } });
        if (!question) {
            res.status(400).json({
                "success": false,
                "message": "question not found"
            });
            return;
        }
        const gradeId = question.level.subject.gradeId;
        if (user.role === "STUDENT" && user.gradeId !== gradeId) {
            res.status(401).json({
                "success": false,
                "message": "student cannot read questions for this grade"
            });
            return;
        }
        if (user.role === "TEACHER") {
            const teachesGrade = yield __1.prisma.teacherGrade.findFirst({ where: { teacherId: user.id, gradeId: gradeId } });
            if (!teachesGrade) {
                res.status(401).json({
                    "success": false,
                    "message": "teacher cannot read questions for this grade"
                });
                return;
            }
        }
        const questionWithAnswers = yield __1.prisma.question.findUnique({ where: { id: question.id }, include: {
                Answers: true,
            } });
        res.status(200).json({
            "success": true,
            "question": questionWithAnswers,
        });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({
            "success": false,
            "message": "internal server error when getting question with its answers"
        });
    }
});
exports.getQuestionWithAnswers = getQuestionWithAnswers;
