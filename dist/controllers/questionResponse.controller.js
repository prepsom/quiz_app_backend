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
    "EASY": 10,
    "MEDIUM": 15,
    "HARD": 20
};
const TIME_BONUS_THRESHOLD = 60; // seconds
const TIME_BONUS_POINTS = 2;
const answerQuestionHandler = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { questionId, selectedAnswerId, timeTaken } = req.body;
        const userId = req.userId;
        // Fetch user and question data in parallel
        const [user, question] = yield Promise.all([
            __1.prisma.user.findUnique({ where: { id: userId } }),
            __1.prisma.question.findUnique({
                where: { id: questionId },
                include: { Answers: true }
            })
        ]);
        if (!user) {
            res.status(400).json({
                success: false,
                message: "Invalid user ID"
            });
            return;
        }
        if (!question) {
            res.status(400).json({
                success: false,
                message: "Question not found"
            });
            return;
        }
        const selectedAnswer = question.Answers.find(answer => answer.id === selectedAnswerId);
        if (!selectedAnswer) {
            res.status(400).json({
                success: false,
                message: "Selected answer is not an option for the question"
            });
            return;
        }
        const pointsEarned = calculatePoints(selectedAnswer.isCorrect, question.difficulty, timeTaken);
        // if a questionResponse by the user to this question already exists -> update the record with the new selectedAnswer and isCorrect field
        // else create a questionResponse
        const questionResponse = yield __1.prisma.questionResponse.findFirst({ where: { responderId: user.id, questionId: question.id } });
        if (questionResponse) {
            const updatedResponse = yield __1.prisma.questionResponse.update({ where: { id: questionResponse.id }, data: {
                    isCorrect: selectedAnswer.isCorrect,
                    chosenAnswerId: selectedAnswer.id,
                    pointsEarned: pointsEarned,
                    createdAt: new Date(Date.now()),
                    responseTime: timeTaken,
                } });
            res.status(200).json({
                success: true,
                message: "Response recorded successfully",
                questionResponse: updatedResponse,
            });
        }
        else {
            const newResponse = yield __1.prisma.questionResponse.create({
                data: {
                    isCorrect: selectedAnswer.isCorrect,
                    pointsEarned,
                    responseTime: timeTaken,
                    chosenAnswerId: selectedAnswer.id,
                    questionId: question.id,
                    responderId: user.id,
                }
            });
            res.status(201).json({
                success: true,
                message: "Response recorded successfully",
                questionResponse: newResponse,
            });
        }
    }
    catch (error) {
        console.error("Error in answerQuestionHandler:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error when responding to question"
        });
    }
});
exports.answerQuestionHandler = answerQuestionHandler;
const calculatePoints = (isCorrect, difficulty, timeTaken) => {
    if (!isCorrect)
        return 0;
    let points = POINTS_MAP[difficulty];
    if (timeTaken <= TIME_BONUS_THRESHOLD) {
        points += TIME_BONUS_POINTS;
    }
    return points;
};
