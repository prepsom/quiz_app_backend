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
exports.getAllCompletedLevelsByUser = exports.getNextLevelHandler = exports.getCompletedLevelsBySubjectHandler = exports.completeLevelHandler = exports.getLevelById = exports.getLevelQuestions = exports.getLevelResultsHandler = exports.updateLevelHandler = exports.deleteLevelHandler = exports.getLevelsBySubjectHandler = exports.addLevelHandler = void 0;
const __1 = require("..");
const addLevelHandler = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // who can add levels -> teachers 
    try {
        const userId = req.userId;
        const { levelName, subjectId, passingQuestions } = req.body;
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
        if (passingQuestions < 0) {
            res.status(400).json({
                "success": false,
                "message": "passing questions cannot be negative"
            });
            return;
        }
        // teacher can add a level 
        const highestPosition = yield __1.prisma.level.findMany({ where: { subjectId: subject.id }, orderBy: {
                position: "desc"
            }, take: 1 }).then(levels => { var _a, _b; return (_b = (_a = levels[0]) === null || _a === void 0 ? void 0 : _a.position) !== null && _b !== void 0 ? _b : -1; });
        const newLevel = yield __1.prisma.level.create({ data: {
                levelName: levelName,
                position: highestPosition + 1,
                subjectId: subject.id,
                passingQuestions: passingQuestions,
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
    try {
        const { levelId } = req.params;
        const userId = req.userId;
        const user = yield __1.prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            res.status(400).json({
                success: false,
                message: "invalid user id"
            });
            return;
        }
        // Fetch level with all question types and their responses
        const level = yield __1.prisma.level.findUnique({
            where: { id: levelId },
            include: {
                Questions: {
                    where: { ready: true },
                    include: {
                        MCQAnswers: true,
                        BlankAnswers: true,
                        BlankSegments: true,
                        MatchingPairs: true,
                        QuestionResponse: {
                            where: { responderId: userId }
                        }
                    }
                }
            }
        });
        if (!level) {
            res.status(400).json({
                success: false,
                message: "level not found"
            });
            return;
        }
        const totalQuestionsInLevel = level.Questions.length;
        if (totalQuestionsInLevel === 0) {
            res.status(400).json({
                success: false,
                message: "no questions in level, user cannot complete level"
            });
            return;
        }
        // Analyze each question's response
        const questionAnalysis = level.Questions.map(question => {
            const response = question.QuestionResponse[0];
            let wasCorrect = false;
            if (response) {
                switch (question.questionType) {
                    case 'MCQ':
                        wasCorrect = response.isCorrect;
                        break;
                    case 'FILL_IN_BLANK':
                        // For fill-in-blank, check if all blanks were answered correctly
                        const blankResponses = response.responseData;
                        const totalBlanks = question.BlankSegments.filter(seg => seg.isBlank).length;
                        const correctBlanks = Object.entries(blankResponses).filter(([index, value]) => {
                            const correctAnswers = question.BlankAnswers.filter(ans => ans.blankIndex === parseInt(index) && ans.isCorrect);
                            return correctAnswers.some(ans => ans.value.toLowerCase() === value.toLowerCase());
                        }).length;
                        wasCorrect = correctBlanks === totalBlanks;
                        break;
                    case 'MATCHING':
                        // For matching, check if all pairs were matched correctly
                        const matchingResponses = response.responseData;
                        const correctMatches = Object.entries(matchingResponses).filter(([left, right]) => {
                            return question.MatchingPairs.some(pair => pair.leftItem === left && pair.rightItem === right);
                        }).length;
                        wasCorrect = correctMatches === question.MatchingPairs.length;
                        break;
                }
            }
            return {
                question,
                questionResponseByUser: response,
                wasCorrect
            };
        });
        const noOfCorrectQuestions = questionAnalysis.filter(qa => qa.wasCorrect).length;
        const totalPointsEarnedInLevel = questionAnalysis.reduce((total, qa) => { var _a; return total + (((_a = qa.questionResponseByUser) === null || _a === void 0 ? void 0 : _a.pointsEarned) || 0); }, 0);
        const percentage = Math.fround((noOfCorrectQuestions / totalQuestionsInLevel) * 100);
        const isComplete = noOfCorrectQuestions >= level.passingQuestions;
        if (!isComplete) {
            res.status(400).json({
                success: false,
                message: "user cannot complete this level. Get better"
            });
            return;
        }
        // Prepare data for OpenAI
        const openAiMessages = questionAnalysis.map(qa => (Object.assign(Object.assign({}, qa.question), { questionResponseByUser: qa.questionResponseByUser, wasCorrect: qa.wasCorrect, questionType: qa.question.questionType })));
        const openAIResponse = yield __1.openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                {
                    role: "system",
                    content: `You are an assistant that provides feedback on user performance in a quiz. 
                        Analyze the user's responses across different question types (MCQ, Fill-in-blank, and Matching) 
                        and provide feedback on the conceptual clarity in the following JSON format:
                        {
                            "remarks": "Personalized remarks based on performance",
                            "strengths": ["strength1", "strength2", ...],
                            "weaknesses": ["weakness1", "weakness2", ...],
                            "recommendations": ["recommendation1", "recommendation2", ...]
                        }
                        Each array should typically contain 2-3 points. Write remarks according to the performance.`
                },
                {
                    role: "user",
                    content: JSON.stringify(openAiMessages)
                }
            ]
        });
        const feedback = openAIResponse.choices[0].message.content;
        const apiData = JSON.parse(feedback || "");
        // Handle level completion update
        const completedLevel = yield __1.prisma.userLevelComplete.findFirst({
            where: { userId: user.id, levelId: level.id }
        });
        if (completedLevel) {
            if (totalPointsEarnedInLevel > completedLevel.totalPoints ||
                noOfCorrectQuestions > completedLevel.noOfCorrectQuestions) {
                yield __1.prisma.userLevelComplete.update({
                    where: { id: completedLevel.id },
                    data: {
                        totalPoints: Math.max(totalPointsEarnedInLevel, completedLevel.totalPoints),
                        noOfCorrectQuestions: Math.max(noOfCorrectQuestions, completedLevel.noOfCorrectQuestions),
                        strengths: apiData.strengths,
                        weaknesses: apiData.weaknesses,
                        recommendations: apiData.recommendations,
                    }
                });
            }
        }
        else {
            yield __1.prisma.userLevelComplete.create({
                data: {
                    userId: user.id,
                    levelId: level.id,
                    totalPoints: totalPointsEarnedInLevel,
                    noOfCorrectQuestions: noOfCorrectQuestions,
                    strengths: apiData.strengths,
                    weaknesses: apiData.weaknesses,
                    recommendations: apiData.recommendations,
                }
            });
        }
        res.status(completedLevel ? 200 : 201).json({
            success: true,
            message: "Level completed",
            noOfCorrectQuestions,
            totalQuestions: totalQuestionsInLevel,
            percentage,
            isComplete,
            strengths: apiData.strengths,
            weaknesses: apiData.weaknesses,
            recommendations: apiData.recommendations,
            remarks: apiData.remarks,
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "internal server error when completing level"
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
        // sort by position 
        completedLevelsByUserInSubject = completedLevelsByUserInSubject.sort((a, b) => a.position - b.position);
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
const getNextLevelHandler = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { levelId } = req.params;
        // the next level in terms of position to the level with id=levelId;
        const level = yield __1.prisma.level.findUnique({ where: { id: levelId } });
        if (!level) {
            res.status(400).json({
                "success": false,
                "message": "level not found",
            });
            return;
        }
        const currentLevelPosition = level.position;
        const nextLevels = yield __1.prisma.level.findMany({ where: { subjectId: level.subjectId, position: { gt: currentLevelPosition } },
            orderBy: {
                position: "asc"
            }
        });
        const nextLevel = nextLevels.length !== 0 ? nextLevels[0] : null;
        res.status(200).json({
            "success": true,
            "nextLevel": nextLevel,
        });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({
            "success": false,
            "message": "internal server error when getting next level"
        });
    }
});
exports.getNextLevelHandler = getNextLevelHandler;
const getAllCompletedLevelsByUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        // we have the logged in user id , get all levels that have been completed by this user
        const completedLevelsByUser = yield __1.prisma.userLevelComplete.findMany({ where: { userId: user.id }, include: {
                level: {
                    include: {
                        subject: true,
                    }
                },
            } });
        const completedLevelsWithScores = completedLevelsByUser.map((item) => {
            return Object.assign(Object.assign({}, item.level), { "totalPoints": item.totalPoints, "noOfCorrectQuestions": item.noOfCorrectQuestions, "strengths": item.strengths, "recommendations": item.recommendations, "weaknesses": item.weaknesses });
        });
        res.status(200).json({
            "success": true,
            "completedLevels": completedLevelsWithScores,
        });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ "success": false, "message": "internal server error when getting completed levels" });
    }
});
exports.getAllCompletedLevelsByUser = getAllCompletedLevelsByUser;
