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
exports.updateQuestionReadyStatus = updateQuestionReadyStatus;
const __1 = require("..");
function updateQuestionReadyStatus(questionId) {
    return __awaiter(this, void 0, void 0, function* () {
        const question = yield __1.prisma.question.findUnique({
            where: { id: questionId },
            include: { Answers: true }
        });
        const ready = (question === null || question === void 0 ? void 0 : question.Answers.length) === 4 &&
            question.Answers.some(a => a.isCorrect);
        yield __1.prisma.question.update({
            where: { id: questionId },
            data: { ready }
        });
    });
}
