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
exports.getGradeByIdHandler = void 0;
const __1 = require("..");
const getGradeByIdHandler = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { gradeId } = req.params;
        const grade = yield __1.prisma.grade.findUnique({ where: { id: gradeId } });
        if (!grade) {
            res.status(404).json({ success: false, message: "Grade not found" });
            return;
        }
        res.status(200).json({ success: true, message: "Grade found", grade });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
});
exports.getGradeByIdHandler = getGradeByIdHandler;
