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
exports.deleteAnswerHandler = exports.updateCorrectAnswerHandler = exports.createAnswerForQuestionHandler = void 0;
const __1 = require("..");
const MCQ_ANSWERS_PER_QUESTION = 4;
const createAnswerForQuestionHandler = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.userId;
        const requestData = req.body;
        const { questionId } = requestData;
        // Authorization checks
        const user = yield __1.prisma.user.findUnique({ where: { id: userId } });
        if (!user || user.role === "STUDENT") {
            res.status(401).json({
                success: false,
                message: "not authorized to create answers for a question"
            });
            return;
        }
        // Get question with type-specific includes
        const question = yield __1.prisma.question.findUnique({
            where: { id: questionId },
            include: {
                level: {
                    select: {
                        subject: true,
                    }
                },
                MCQAnswers: true,
                BlankAnswers: true,
                MatchingPairs: true,
                BlankSegments: {
                    where: { isBlank: true }
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
        // Teacher grade authorization check
        const gradeId = question.level.subject.gradeId;
        if (user.role === "TEACHER") {
            const teachesGrade = yield __1.prisma.teacherGrade.findFirst({
                where: { teacherId: user.id, gradeId: gradeId }
            });
            if (!teachesGrade) {
                res.status(401).json({
                    success: false,
                    message: "teacher cannot add answers to a question in this grade"
                });
                return;
            }
        }
        // Validate request type matches question type
        if (requestData.type !== question.questionType) {
            res.status(400).json({
                success: false,
                message: `Invalid answer type. Question is of type ${question.questionType}`
            });
            return;
        }
        let result;
        switch (requestData.type) {
            case 'MCQ':
                result = yield handleMCQAnswer(question, requestData);
                break;
            case 'FILL_IN_BLANK':
                result = yield handleBlankAnswer(question, requestData);
                break;
            case 'MATCHING':
                result = yield handleMatchingPair(question, requestData);
                break;
            default:
                res.status(400).json({
                    success: false,
                    message: "invalid question type"
                });
                return;
        }
        if ('error' in result) {
            res.status(400).json({
                success: false,
                message: result.error
            });
            return;
        }
        yield updateQuestionReadyStatus(question.id);
        res.status(201).json({
            success: true,
            answer: result.data
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Internal server error when creating answer for question"
        });
    }
});
exports.createAnswerForQuestionHandler = createAnswerForQuestionHandler;
const handleMCQAnswer = (question, data) => __awaiter(void 0, void 0, void 0, function* () {
    if (question.MCQAnswers.length >= MCQ_ANSWERS_PER_QUESTION) {
        return { error: "question already has maximum allowed answers" };
    }
    if (data.value.trim() === "") {
        return { error: "please enter an answer value" };
    }
    const answer = yield __1.prisma.answer.create({
        data: {
            value: data.value,
            questionId: question.id,
            isCorrect: data.isCorrect || false
        }
    });
    return { data: answer };
});
const handleBlankAnswer = (question, data) => __awaiter(void 0, void 0, void 0, function* () {
    // Validate blank index exists
    const totalBlanks = question.BlankSegments.length;
    if (data.blankIndex >= totalBlanks) {
        return { error: `invalid blank index. Question has ${totalBlanks} blanks` };
    }
    if (data.value.trim() === "") {
        return { error: "please enter an answer value" };
    }
    // Check if answer already exists for this blank index
    const existingAnswer = question.BlankAnswers.find((a) => a.blankIndex === data.blankIndex);
    if (existingAnswer) {
        return { error: `answer already exists for blank index ${data.blankIndex}` };
    }
    const answer = yield __1.prisma.blankAnswer.create({
        data: {
            value: data.value,
            questionId: question.id,
            blankIndex: data.blankIndex
        }
    });
    return { data: answer };
});
const handleMatchingPair = (question, data) => __awaiter(void 0, void 0, void 0, function* () {
    if (data.leftItem.trim() === "" || data.rightItem.trim() === "") {
        return { error: "please enter both left and right items" };
    }
    // Check for duplicate pairs
    const existingPair = question.MatchingPairs.find((p) => p.leftItem === data.leftItem ||
        p.rightItem === data.rightItem);
    if (existingPair) {
        return { error: "matching pair with these items already exists" };
    }
    const pair = yield __1.prisma.matchingPair.create({
        data: {
            leftItem: data.leftItem,
            rightItem: data.rightItem,
            questionId: question.id,
            order: data.order
        }
    });
    return { data: pair };
});
// Helper function to determine if a question is ready
const updateQuestionReadyStatus = (questionId) => __awaiter(void 0, void 0, void 0, function* () {
    const question = yield __1.prisma.question.findUnique({
        where: { id: questionId },
        include: {
            MCQAnswers: true,
            BlankAnswers: true,
            BlankSegments: { where: { isBlank: true } },
            MatchingPairs: true
        }
    });
    if (!question)
        return;
    let isReady = false;
    switch (question.questionType) {
        case 'MCQ':
            isReady = question.MCQAnswers.length >= MCQ_ANSWERS_PER_QUESTION &&
                question.MCQAnswers.some(answer => answer.isCorrect);
            break;
        case 'FILL_IN_BLANK':
            isReady = question.BlankAnswers.length === question.BlankSegments.length;
            break;
        case 'MATCHING':
            isReady = question.MatchingPairs.length >= 2; // Minimum 2 pairs for matching
            break;
    }
    yield __1.prisma.question.update({
        where: { id: questionId },
        data: { ready: isReady }
    });
});
const updateCorrectAnswerHandler = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { answerId } = req.params;
        const { isCorrect } = req.body;
        const userId = req.userId;
        // Authorization check
        const user = yield __1.prisma.user.findUnique({ where: { id: userId } });
        if (!user || user.role === "STUDENT") {
            res.status(401).json({
                success: false,
                message: "not authorized to modify correct answers"
            });
            return;
        }
        // Get answer with question details based on answer type
        const answerData = yield getAnswerWithQuestionDetails(answerId);
        if (!answerData || !answerData.question) {
            res.status(400).json({
                success: false,
                message: "answer not found"
            });
            return;
        }
        // Teacher grade authorization check
        const gradeId = answerData.question.level.subject.gradeId;
        if (user.role === "TEACHER") {
            const teachesGrade = yield __1.prisma.teacherGrade.findFirst({
                where: { teacherId: user.id, gradeId: gradeId }
            });
            if (!teachesGrade) {
                res.status(401).json({
                    success: false,
                    message: "teacher cannot modify correct answers for questions in this grade"
                });
                return;
            }
        }
        let result;
        switch (answerData.question.questionType) {
            case 'MCQ':
                result = yield handleMCQCorrectAnswer(answerData);
                break;
            case 'FILL_IN_BLANK':
                result = yield handleBlankCorrectAnswer(answerData, isCorrect);
                break;
            case 'MATCHING':
                res.status(400).json({
                    success: false,
                    message: "matching questions do not support modifying correct answers"
                });
                return;
            default:
                res.status(400).json({
                    success: false,
                    message: "invalid question type"
                });
                return;
        }
        yield updateQuestionReadyStatus(answerData.question.id);
        res.status(200).json({
            success: true,
            message: result.message
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "internal server error when updating the correct answer"
        });
    }
});
exports.updateCorrectAnswerHandler = updateCorrectAnswerHandler;
const getAnswerWithQuestionDetails = (answerId) => __awaiter(void 0, void 0, void 0, function* () {
    // Try to get MCQ answer first
    const mcqAnswer = yield __1.prisma.answer.findUnique({
        where: { id: answerId },
        include: {
            question: {
                include: {
                    MCQAnswers: true,
                    level: {
                        select: {
                            subject: true
                        }
                    }
                }
            }
        }
    });
    if (mcqAnswer)
        return mcqAnswer;
    // Try to get Blank answer
    const blankAnswer = yield __1.prisma.blankAnswer.findUnique({
        where: { id: answerId },
        include: {
            question: {
                include: {
                    BlankAnswers: true,
                    level: {
                        select: {
                            subject: true
                        }
                    }
                }
            }
        }
    });
    return blankAnswer;
});
const handleMCQCorrectAnswer = (answer) => __awaiter(void 0, void 0, void 0, function* () {
    const answers = answer.question.MCQAnswers;
    let currentCorrectAnswer = answers.find((a) => a.isCorrect);
    if (!currentCorrectAnswer) {
        // No correct answer yet - make this one correct
        yield __1.prisma.answer.update({
            where: { id: answer.id },
            data: { isCorrect: true }
        });
        return { message: `Answer with id ${answer.id} is now the correct answer` };
    }
    if (answer.id === currentCorrectAnswer.id) {
        // This answer is currently correct - unmark it
        yield __1.prisma.answer.update({
            where: { id: answer.id },
            data: { isCorrect: false }
        });
        return { message: `Answer with id ${answer.id} is no longer marked as correct` };
    }
    // Another answer is correct - switch correctness
    yield __1.prisma.$transaction([
        __1.prisma.answer.update({
            where: { id: currentCorrectAnswer.id },
            data: { isCorrect: false }
        }),
        __1.prisma.answer.update({
            where: { id: answer.id },
            data: { isCorrect: true }
        })
    ]);
    return { message: `Answer with id ${answer.id} is now the correct answer` };
});
const handleBlankCorrectAnswer = (answer, isCorrect) => __awaiter(void 0, void 0, void 0, function* () {
    // For fill-in-blank, we allow multiple correct answers per blank
    // If isCorrect is not provided, we toggle the current state
    const newIsCorrect = isCorrect !== null && isCorrect !== void 0 ? isCorrect : !answer.isCorrect;
    yield __1.prisma.blankAnswer.update({
        where: { id: answer.id },
        data: { isCorrect: newIsCorrect }
    });
    return {
        message: `Answer with id ${answer.id} is now ${newIsCorrect ? 'marked' : 'unmarked'} as correct`
    };
});
const deleteAnswerHandler = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // delete answer handler
    try {
        const { answerId } = req.params;
        const userId = req.userId;
        const user = yield __1.prisma.user.findUnique({ where: { id: userId } });
        if (!user || user.role === "STUDENT") {
            res.status(401).json({
                "success": false,
                "message": "student cannot delete answers"
            });
            return;
        }
        const answer = yield __1.prisma.answer.findUnique({ where: { id: answerId }, include: {
                question: {
                    select: {
                        level: {
                            select: {
                                subject: true,
                            }
                        }
                    }
                }
            } });
        if (!answer) {
            res.status(400).json({
                "success": false,
                "message": "answer not found"
            });
            return;
        }
        if (user.role === "TEACHER") {
            const gradeId = answer.question.level.subject.gradeId;
            const teachesGrade = yield __1.prisma.teacherGrade.findFirst({ where: { teacherId: user.id, gradeId: gradeId } });
            if (!teachesGrade) {
                res.status(401).json({
                    "success": false,
                    "message": "teacher cannot delete answers in this grade"
                });
                return;
            }
        }
        yield __1.prisma.answer.delete({ where: { id: answer.id } });
        yield updateQuestionReadyStatus(answer.questionId);
        res.status(200).json({
            "success": true,
            "message": "answer deleted successfully"
        });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({
            "success": false,
            "message": "internal server error when deleting answer"
        });
    }
});
exports.deleteAnswerHandler = deleteAnswerHandler;
