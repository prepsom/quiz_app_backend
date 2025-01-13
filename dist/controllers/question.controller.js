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
exports.getAnsweredQuestionsByLevelHandler = exports.getQuestionWithAnswers = exports.deleteQuestionHandler = exports.addQuestionByLevelHandler = exports.getQuestionsByLevelHandler = void 0;
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
        const questions = yield __1.prisma.question.findMany({ where: { levelId: level.id, ready: true } });
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
const isMCQQuestion = (data) => {
    return data.questionType === 'MCQ';
};
const isFillBlankQuestion = (data) => {
    return data.questionType === 'FILL_IN_BLANK';
};
const isMatchingQuestion = (data) => {
    return data.questionType === 'MATCHING';
};
const addQuestionByLevelHandler = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const requestData = req.body;
        const userId = req.userId;
        console.log(requestData);
        // Authorization checks remain the same
        const user = yield __1.prisma.user.findUnique({ where: { id: userId } });
        if (!user || user.role === "STUDENT") {
            res.status(401).json({
                success: false,
                message: "Only teachers can add questions"
            });
            return;
        }
        const level = yield __1.prisma.level.findUnique({
            where: { id: requestData.levelId },
            include: { subject: true }
        });
        if (!level) {
            res.status(401).json({
                success: false,
                message: "Invalid level id"
            });
            return;
        }
        // Teacher authorization check
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
        // Validate request data based on question type
        if (isFillBlankQuestion(requestData)) {
            // Validate fill in blank specific data
            console.log(!requestData.segments);
            console.log(requestData.segments.length === 0);
            if (!requestData.segments || requestData.segments.length === 0) {
                res.status(400).json({
                    success: false,
                    message: "Fill in the blank questions must have at least one segment"
                });
                return;
            }
            if (!requestData.answers || requestData.answers.length === 0) {
                res.status(400).json({
                    success: false,
                    message: "Fill in the blank questions must have at least one answer"
                });
                return;
            }
            // Validate that answers correspond to blank segments
            const blankIndices = requestData.segments
                .map((segment, index) => segment.isBlank ? index : -1)
                .filter(index => index !== -1);
            const invalidAnswers = requestData.answers.some(answer => !blankIndices.includes(answer.blankIndex));
            if (invalidAnswers) {
                res.status(400).json({
                    success: false,
                    message: "Answer indices must correspond to blank segments"
                });
                return;
            }
        }
        try {
            const isReady = validateReadyField(requestData);
            let question = null;
            if (isMCQQuestion(requestData)) {
                question = yield __1.prisma.question.create({
                    data: {
                        questionTitle: requestData.questionTitle,
                        difficulty: requestData.difficulty,
                        levelId: requestData.levelId,
                        explanation: requestData.explanation,
                        questionType: 'MCQ',
                        ready: false, // Use the validated ready value
                    }
                });
            }
            else if (isFillBlankQuestion(requestData)) {
                console.log('FILL IN THE BLANK QUESTION CREATED');
                question = yield __1.prisma.question.create({
                    data: {
                        questionTitle: requestData.questionTitle,
                        difficulty: requestData.difficulty,
                        levelId: requestData.levelId,
                        explanation: requestData.explanation,
                        questionType: 'FILL_IN_BLANK',
                        ready: isReady, // Use the validated ready value
                        BlankSegments: {
                            createMany: {
                                data: requestData.segments.map((segment, index) => ({
                                    text: segment.text,
                                    isBlank: segment.isBlank,
                                    blankHint: segment.blankHint || null,
                                    order: index
                                }))
                            }
                        },
                        BlankAnswers: {
                            createMany: {
                                data: requestData.answers.map(answer => ({
                                    value: answer.value,
                                    blankIndex: answer.blankIndex,
                                    isCorrect: true
                                }))
                            }
                        }
                    }
                });
            }
            else if (isMatchingQuestion(requestData)) {
                question = yield __1.prisma.question.create({
                    data: {
                        questionTitle: requestData.questionTitle,
                        difficulty: requestData.difficulty,
                        levelId: requestData.levelId,
                        explanation: requestData.explanation,
                        questionType: 'MATCHING',
                        ready: isReady, // Use the validated ready value
                        MatchingPairs: {
                            createMany: {
                                data: requestData.pairs.map((pair, index) => ({
                                    leftItem: pair.leftItem,
                                    rightItem: pair.rightItem,
                                    order: index
                                }))
                            }
                        }
                    }
                });
            }
            res.status(201).json({
                success: true,
                data: question
            });
        }
        catch (error) {
            console.error('Error creating question:', error);
            res.status(500).json({
                success: false,
                message: "Failed to create question",
                error: error instanceof Error ? error.message : "Unknown error"
            });
        }
    }
    catch (error) {
        console.error('Handler error:', error);
        res.status(500).json({
            success: false,
            message: "Internal server error when adding question",
            error: error instanceof Error ? error.message : "Unknown error"
        });
    }
});
exports.addQuestionByLevelHandler = addQuestionByLevelHandler;
const validateReadyField = (requestData) => {
    var _a;
    if (isFillBlankQuestion(requestData)) {
        // Fill in the blank: At least one blank segment and corresponding answers
        if (!requestData.segments || requestData.segments.length === 0)
            return false;
        const blankIndices = requestData.segments
            .map((segment, index) => (segment.isBlank ? index : -1))
            .filter(index => index !== -1);
        const validAnswers = requestData.answers && requestData.answers.length > 0;
        const allAnswersMatchBlanks = (_a = requestData.answers) === null || _a === void 0 ? void 0 : _a.every(answer => blankIndices.includes(answer.blankIndex));
        return validAnswers && allAnswersMatchBlanks;
    }
    else if (isMatchingQuestion(requestData)) {
        // Matching: Ensure at least 3 valid pairs
        return requestData.pairs && requestData.pairs.length >= 3;
    }
    return false; // Default to not ready for unrecognized question types
};
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
                success: false,
                message: "invalid user id"
            });
            return;
        }
        // Get question with all related data based on question type
        const question = yield __1.prisma.question.findUnique({
            where: { id: questionId },
            include: {
                level: {
                    select: {
                        subject: true,
                    }
                },
                MCQAnswers: true,
                BlankSegments: {
                    orderBy: {
                        order: 'asc'
                    }
                },
                BlankAnswers: true,
                MatchingPairs: {
                    orderBy: {
                        order: 'asc'
                    }
                }
            }
        });
        if (!question) {
            res.status(400).json({
                success: false,
                message: "question not found"
            });
            return;
        }
        const gradeId = question.level.subject.gradeId;
        // Authorization checks
        if (user.role === "STUDENT" && user.gradeId !== gradeId) {
            res.status(401).json({
                success: false,
                message: "student cannot read questions for this grade"
            });
            return;
        }
        if (user.role === "TEACHER") {
            const teachesGrade = yield __1.prisma.teacherGrade.findFirst({
                where: { teacherId: user.id, gradeId: gradeId }
            });
            if (!teachesGrade) {
                res.status(401).json({
                    success: false,
                    message: "teacher cannot read questions for this grade"
                });
                return;
            }
        }
        // Process question data based on type
        let processedQuestion;
        switch (question.questionType) {
            case "MCQ":
                processedQuestion = processMCQQuestion(question, user.role === "STUDENT");
                break;
            case "FILL_IN_BLANK":
                processedQuestion = processFillInBlankQuestion(question, user.role === "STUDENT");
                break;
            case "MATCHING":
                processedQuestion = processMatchingQuestion(question, user.role === "STUDENT");
                break;
            default:
                res.status(400).json({
                    success: false,
                    message: "invalid question type"
                });
                return;
        }
        res.status(200).json({
            success: true,
            question: processedQuestion
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "internal server error when getting question with its answers"
        });
    }
});
exports.getQuestionWithAnswers = getQuestionWithAnswers;
// Helper function to shuffle arrays
const shuffleArray = (array) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
};
const processMCQQuestion = (question, isStudent) => {
    let answers = question.MCQAnswers;
    if (isStudent) {
        // Remove isCorrect field for students
        answers = answers.map((answer) => ({
            id: answer.id,
            value: answer.value,
            questionId: answer.questionId
        }));
    }
    return Object.assign(Object.assign({}, question), { MCQAnswers: shuffleArray(answers), BlankSegments: undefined, BlankAnswers: undefined, MatchingPairs: undefined });
};
const processFillInBlankQuestion = (question, isStudent) => {
    const result = Object.assign(Object.assign({}, question), { MCQAnswers: undefined, BlankSegments: question.BlankSegments, BlankAnswers: isStudent ? undefined : question.BlankAnswers, MatchingPairs: undefined });
    return result;
};
const processMatchingQuestion = (question, isStudent) => {
    let pairs = question.MatchingPairs;
    if (isStudent) {
        // Shuffle right items for students while maintaining the correct order of left items
        const rightItems = shuffleArray(pairs.map((pair) => pair.rightItem));
        pairs = pairs.map((pair, index) => ({
            id: pair.id,
            leftItem: pair.leftItem,
            rightItem: rightItems[index],
            order: pair.order
        }));
    }
    return Object.assign(Object.assign({}, question), { MCQAnswers: undefined, BlankSegments: undefined, BlankAnswers: undefined, MatchingPairs: pairs });
};
const getAnsweredQuestionsByLevelHandler = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { levelId } = req.params;
        const userId = req.userId;
        // get questions which have questionResponses by the user with id=userId and is in the level
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
        // get questions which have responses by the user and in the level with id = level.id
        const answeredQuestions = yield __1.prisma.question.findMany({ where: {
                levelId: level.id,
                ready: true,
                QuestionResponse: {
                    some: {
                        responderId: user.id,
                    }
                }
            } });
        res.status(200).json({
            "success": true,
            "answeredQuestions": answeredQuestions,
        });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({
            "success": false,
            "message": "internal server error when getting answered questions"
        });
    }
});
exports.getAnsweredQuestionsByLevelHandler = getAnsweredQuestionsByLevelHandler;
