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
const answerQuestionHandler = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { questionId, selectedAnswerId, timeTaken } = req.body;
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
                Answers: true,
            } });
        if (!question) {
            // error resposne (400)
            return;
        }
        const selectedAnswer = yield __1.prisma.answer.findUnique({ where: { id: selectedAnswerId } });
        if (!selectedAnswer) {
            // error resposne
            return;
        }
        const selectedAnswerInQuestionAnswers = question.Answers.find((answer) => answer.id === selectedAnswer.id);
        if (!selectedAnswerInQuestionAnswers) {
            res.status(400).json({
                "success": false,
                "message": "selected answer is not an option for the question"
            });
            return;
        }
        const isAnswerCorrect = selectedAnswerInQuestionAnswers.isCorrect;
        const questionDifficulty = question.difficulty;
        let pointsEarned;
        if (isAnswerCorrect) {
            switch (questionDifficulty) {
                case "EASY":
                    pointsEarned = 10;
                    break;
                case "MEDIUM":
                    pointsEarned = 15;
                    break;
                case "HARD":
                    pointsEarned = 20;
                    break;
            }
            // bonus point 
            if (timeTaken <= 60) {
                pointsEarned += 2;
            }
        }
        else {
            pointsEarned = 0;
        }
        const questionResponse = yield __1.prisma.questionResponse.create({
            data: {
                isCorrect: isAnswerCorrect,
                pointsEarned: pointsEarned,
                responseTime: timeTaken,
                chosenAnswerId: selectedAnswer.id,
                questionId: question.id,
                responderId: user.id,
            }
        });
        res.status(201).json({
            "success": true,
            "message": "user responded to question successfully",
            questionResponse,
        });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({
            "success": false,
            "message": "internal server error when responding to question"
        });
    }
});
exports.answerQuestionHandler = answerQuestionHandler;
