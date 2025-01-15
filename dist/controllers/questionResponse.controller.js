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
exports.answerQuestionHandler = void 0;
const __1 = require("..");
const POINTS_MAP = {
    EASY: 10,
    MEDIUM: 15,
    HARD: 20,
};
const TIME_BONUS_THRESHOLD = 60; // seconds
const TIME_BONUS_POINTS = 2;
const answerQuestionHandler = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const responseData = req.body;
        const userId = req.userId;
        // Fetch user and question data with appropriate relations based on type
        const [user, question] = yield Promise.all([
            __1.prisma.user.findUnique({ where: { id: userId } }),
            __1.prisma.question.findUnique({
                where: { id: responseData.questionId },
                include: {
                    MCQAnswers: true,
                    BlankAnswers: true,
                    MatchingPairs: true,
                },
            }),
        ]);
        if (!user || !question) {
            res.status(400).json({
                success: false,
                message: !user ? "Invalid user ID" : "Question not found",
            });
            return;
        }
        // Validate response and calculate points based on question type
        const validationResult = yield validateResponse(responseData, question);
        if (!validationResult.success) {
            res.status(400).json({
                success: false,
                message: validationResult.message || "",
            });
            return;
        }
        const pointsEarned = calculatePoints(validationResult.isCorrect, question.difficulty, responseData.timeTaken);
        // Update or create question response
        const existingResponse = yield __1.prisma.questionResponse.findFirst({
            where: { responderId: user.id, questionId: question.id },
        });
        const responsePayload = {
            isCorrect: validationResult.isCorrect,
            pointsEarned,
            responseTime: responseData.timeTaken,
            chosenAnswerId: "selectedAnswerId" in responseData
                ? responseData.selectedAnswerId
                : null,
            responseData: "selectedAnswerId" in responseData ? null : responseData,
            questionId: question.id,
            responderId: userId,
        };
        const questionResponse = existingResponse
            ? yield __1.prisma.questionResponse.update({
                where: { id: existingResponse.id },
                data: Object.assign(Object.assign({}, responsePayload), { createdAt: new Date(Date.now()) }),
            })
            : yield __1.prisma.questionResponse.create({
                data: responsePayload,
            });
        res.status(existingResponse ? 200 : 201).json({
            success: true,
            message: "Response recorded successfully",
            questionResponse,
            correctData: validationResult.correctData,
        });
    }
    catch (error) {
        console.error("Error in answerQuestionHandler:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error when responding to question",
        });
    }
});
exports.answerQuestionHandler = answerQuestionHandler;
const validateResponse = (responseData, question) => __awaiter(void 0, void 0, void 0, function* () {
    switch (responseData.type) {
        case "MCQ":
            return validateMCQResponse(responseData, question);
        case "FILL_IN_BLANK":
            return validateFillInBlankResponse(responseData, question);
        case "MATCHING":
            return validateMatchingResponse(responseData, question);
        default:
            return {
                success: false,
                message: "Invalid question type",
            };
    }
});
const validateMCQResponse = (response, question) => {
    const selectedAnswer = question.MCQAnswers.find((answer) => answer.id === response.selectedAnswerId);
    if (!selectedAnswer) {
        return {
            success: false,
            message: "Selected answer is not an option for the question",
        };
    }
    const correctAnswer = question.MCQAnswers.find((answer) => answer.isCorrect);
    return {
        success: true,
        isCorrect: selectedAnswer.isCorrect,
        correctData: { correctAnswerId: correctAnswer === null || correctAnswer === void 0 ? void 0 : correctAnswer.id },
    };
};
const validateFillInBlankResponse = (response, question) => {
    const correctAnswers = question.BlankAnswers;
    let isCorrect = true;
    // Group correct answers by blank index
    const correctAnswersByIndex = correctAnswers.reduce((acc, answer) => {
        if (!acc[answer.blankIndex])
            acc[answer.blankIndex] = [];
        acc[answer.blankIndex].push(answer.value.toLowerCase().trim());
        return acc;
    }, {});
    // Create a map of user answers for easy lookup
    const userAnswerMap = new Map(response.answers.map((answer) => [
        answer.blankIndex,
        answer.value.toLowerCase().trim(),
    ]));
    // Check if all required blanks are filled and correct
    for (const [blankIndex, correctValues] of Object.entries(correctAnswersByIndex)) {
        const userAnswer = userAnswerMap.get(parseInt(blankIndex));
        // If no answer provided for this blank or answer is incorrect
        if (!userAnswer || !correctValues.includes(userAnswer)) {
            isCorrect = false;
            break;
        }
    }
    // Check if user provided answers for non-existent blanks
    for (const [blankIndex] of userAnswerMap) {
        if (!correctAnswersByIndex[blankIndex]) {
            isCorrect = false;
            break;
        }
    }
    return {
        success: true,
        isCorrect,
        correctData: { correctAnswers: correctAnswersByIndex },
    };
};
const validateMatchingResponse = (response, question) => {
    const correctPairs = question.MatchingPairs;
    let isCorrect = true;
    // Convert correct pairs to a map for easy lookup
    const correctPairsMap = new Map(correctPairs.map((pair) => [
        pair.leftItem.toLowerCase().trim(),
        pair.rightItem.toLowerCase().trim(),
    ]));
    // Check each submitted pair
    response.pairs.forEach((pair) => {
        const correctRight = correctPairsMap.get(pair.leftItem.toLowerCase().trim());
        if (correctRight !== pair.rightItem.toLowerCase().trim()) {
            isCorrect = false;
        }
    });
    return {
        success: true,
        isCorrect,
        correctData: { correctPairs },
    };
};
const calculatePoints = (isCorrect, difficulty, timeTaken) => {
    if (!isCorrect)
        return 0;
    let points = POINTS_MAP[difficulty];
    if (timeTaken <= TIME_BONUS_THRESHOLD) {
        points += TIME_BONUS_POINTS;
    }
    return points;
};
