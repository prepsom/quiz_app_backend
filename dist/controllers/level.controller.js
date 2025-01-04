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
exports.getCompletedLevelsBySubjectHandler = exports.completeLevelHandler = exports.getLevelById = exports.getLevelQuestions = exports.getLevelResultsHandler = exports.updateLevelHandler = exports.deleteLevelHandler = exports.getLevelsBySubjectHandler = exports.addLevelHandler = void 0;
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
const getLevelResultsHandler = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { levelId } = req.params;
        const userId = req.userId;
        // get results for questions answered in a level by the user 
        const user = yield __1.prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            res.status(400).json({
                "success": false,
                "message": "invalid user id"
            });
            return;
        }
        const level = yield __1.prisma.level.findUnique({ where: { id: levelId } });
        if (!level) {
            res.status(400).json({
                "success": false,
                "message": "level not found"
            });
            return;
        }
        const responses = yield __1.prisma.questionResponse.findMany({
            where: {
                responderId: user.id,
                question: {
                    levelId: level.id,
                }
            },
            include: {
                question: true,
            }
        });
        if (responses.length === 0) {
            res.status(404).json({
                "success": false,
                "message": "No results found for this level"
            });
            return;
        }
        const result = {
            totalPoints: responses.reduce((sum, r) => sum + r.pointsEarned, 0),
            correctAnswers: responses.filter(r => r.isCorrect).length,
            totalQuestions: responses.length,
            questionResults: responses.map((r => {
                return {
                    question: r.question,
                    isCorrect: r.isCorrect,
                    pointsEarned: r.pointsEarned,
                    responseTime: r.responseTime
                };
            }))
        };
        res.status(200).json({
            success: true,
            result
        });
    }
    catch (error) {
        console.error("Error in getLevelResultsHandler:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error when fetching level results"
        });
    }
});
exports.getLevelResultsHandler = getLevelResultsHandler;
const getLevelQuestions = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
                "message": "level not  found"
            });
            return;
        }
        const gradeId = level.subject.gradeId;
        if (user.role === "STUDENT") {
            if (user.gradeId !== gradeId) {
                res.status(401).json({
                    "success": false,
                    "message": "user not authorized to get questions for this grade"
                });
                return;
            }
        }
        if (user.role === "TEACHER") {
            // 
            const teachesGrade = yield __1.prisma.teacherGrade.findFirst({ where: { teacherId: user.id, gradeId: gradeId } });
            if (!teachesGrade) {
                res.status(401).json({
                    "success": false,
                    "message": "teacher not authorized to get questions for this grade"
                });
                return;
            }
        }
        // get all questions in a level and the question id's user has made responses to
        const allQuestions = yield __1.prisma.question.findMany({ where: { levelId: level.id, ready: true } });
        const answeredQuestions = yield __1.prisma.question.findMany({
            where: { levelId: level.id, ready: true, QuestionResponse: {
                    some: {
                        responderId: user.id,
                    }
                } },
            include: {
                QuestionResponse: {
                    select: {
                        pointsEarned: true,
                        responderId: true,
                    }
                }
            }
        });
        let currentPointsEarnedInLevel = 0;
        for (let i = 0; i < answeredQuestions.length; i++) {
            const answeredQuestionResponses = answeredQuestions[i].QuestionResponse;
            for (let k = 0; k < answeredQuestionResponses.length; k++) {
                if (answeredQuestionResponses[k].responderId === user.id) {
                    currentPointsEarnedInLevel = currentPointsEarnedInLevel + answeredQuestionResponses[k].pointsEarned;
                    break;
                }
            }
        }
        console.log(currentPointsEarnedInLevel);
        const answeredQuestionIds = answeredQuestions.map((question) => question.id);
        res.status(200).json({
            "success": true,
            allQuestions,
            answeredQuestionIds,
            "currentPointsInLevel": currentPointsEarnedInLevel,
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
exports.getLevelQuestions = getLevelQuestions;
const getLevelById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { levelId } = req.params;
        const level = yield __1.prisma.level.findUnique({ where: { id: levelId } });
        if (!level) {
            res.status(400).json({
                "success": false,
                "message": "level not found"
            });
            return;
        }
        res.status(200).json({ "success": true, level });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({
            "success": false,
            "message": "internal server error when getting level by id"
        });
    }
});
exports.getLevelById = getLevelById;
const completeLevelHandler = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // logic for this handler
    // authenticated user making this request to complete this level
    // before he/she completes this level , we will have to check their responses to the questions in this level
    // if noOfCorrectQuestions / totalQuestionsInLevel * 100 > 50% -> level complete else not 
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
                Questions: {
                    where: { ready: true },
                    select: {
                        QuestionResponse: true,
                    }
                },
            } });
        if (!level) {
            res.status(400).json({
                "success": false,
                "message": "level not found"
            });
            return;
        }
        // check if level already completed by user
        const totatQuestionsInLevel = level.Questions.length;
        let noOfCorrectQuestions = 0;
        let totalPointsEarnedInLevel = 0;
        for (let i = 0; i < totatQuestionsInLevel; i++) {
            const questionResponse = level.Questions[i].QuestionResponse
                .find((questionResponse) => questionResponse.responderId === user.id);
            if (!questionResponse) {
                continue;
            }
            if (questionResponse.isCorrect) {
                noOfCorrectQuestions++;
            }
            totalPointsEarnedInLevel += questionResponse.pointsEarned;
        }
        let isComplete = false;
        const percentage = (noOfCorrectQuestions / totatQuestionsInLevel) * 100;
        console.log('percentage :- ', percentage);
        if (percentage > 50) {
            isComplete = true;
        }
        if (!isComplete) {
            res.status(400).json({
                "success": false,
                "message": "user cannot complete this level.Get better"
            });
            return;
        }
        const isLevelComplete = yield __1.prisma.userLevelComplete.findFirst({ where: { userId: user.id, levelId: level.id } });
        if (isLevelComplete) {
            res.status(200).json({
                "success": true,
                "message": "level completed",
                "noOfCorrectQuestions": noOfCorrectQuestions,
                "totalQuestions": totatQuestionsInLevel,
                "percentage": percentage,
                "isComplete": isComplete,
            });
            return;
        }
        yield __1.prisma.userLevelComplete.create({ data: { userId: user.id, levelId: level.id, totalPoints: totalPointsEarnedInLevel } });
        res.status(201).json({
            "success": true,
            "message": "level completed",
            "noOfCorrectQuestions": noOfCorrectQuestions,
            "totalQuestions": totatQuestionsInLevel,
            "percentage": percentage,
            "isComplete": isComplete,
        });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({
            "success": false,
            "message": "internal server error when completing level "
        });
    }
});
exports.completeLevelHandler = completeLevelHandler;
const getCompletedLevelsBySubjectHandler = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { subjectId } = req.params;
        const userId = req.userId;
        const user = yield __1.prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            res.status(400).json({
                "success": false,
                "message": "invalid user id"
            });
            return;
        }
        const subject = yield __1.prisma.subject.findUnique({ where: { id: subjectId } });
        if (!subject) {
            res.status(400).json({
                "success": false,
                "message": "subject not found"
            });
            return;
        }
        // completed levels ,
        let completedLevelsByUser = yield __1.prisma.userLevelComplete.findMany({ where: { userId: user.id }, include: {
                level: true,
            } });
        // completedLevelsByUser -> includes all levels completed by user regardless of subject
        // allLevelsInSubject -> all levels in a subject duh
        let completedLevelsByUserInSubject = completedLevelsByUser.filter((completedLevel) => completedLevel.level.subjectId === subject.id)
            .map((completedLevel) => completedLevel.level);
        res.status(200).json({
            "success": true,
            "completedLevels": completedLevelsByUserInSubject,
        });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({
            "success": false,
            "message": "internal server error when getting completed levels"
        });
    }
});
exports.getCompletedLevelsBySubjectHandler = getCompletedLevelsBySubjectHandler;
