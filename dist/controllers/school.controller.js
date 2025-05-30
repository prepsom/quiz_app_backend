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
exports.getSchoolByIdHandler = exports.getGradesBySchoolHandler = exports.getSchoolsHandler = exports.getSchoolBySchoolNameHandler = exports.getSchoolNameByGradeHandler = void 0;
const __1 = require("..");
const getSchoolNameByGradeHandler = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { gradeId } = req.params;
        const grade = yield __1.prisma.grade.findUnique({ where: { id: gradeId } });
        if (!grade) {
            res.status(400).json({ success: false, message: "invalid grade id" });
            return;
        }
        const schoolId = grade.schoolId;
        const school = yield __1.prisma.school.findUnique({ where: { id: schoolId } });
        if (!school) {
            // invalid reference in db , schoolId references to school table primary key but not available
            throw new Error("Invalid reference between grades and schools table in DB");
        }
        res.status(200).json({ success: true, schoolName: school.schoolName });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: "internal server error when getting school name",
        });
    }
});
exports.getSchoolNameByGradeHandler = getSchoolNameByGradeHandler;
const getSchoolBySchoolNameHandler = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { schoolName } = req.params;
        if (!schoolName.trim()) {
            res
                .status(400)
                .json({ success: false, message: "school name is empty of undefined" });
            return;
        }
        const school = yield __1.prisma.school.findFirst({
            where: { schoolName: schoolName.trim() },
        });
        if (!school) {
            res.status(400).json({
                success: false,
                message: `school with name ${schoolName.trim()} not found`,
            });
            return;
        }
        res.status(200).json({ success: true, school });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: "internal server error" });
    }
});
exports.getSchoolBySchoolNameHandler = getSchoolBySchoolNameHandler;
const getSchoolsHandler = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const schools = yield __1.prisma.school.findMany();
        res.status(200).json({ success: true, schools });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: "internal server error" });
    }
});
exports.getSchoolsHandler = getSchoolsHandler;
const getGradesBySchoolHandler = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { schoolId } = req.params;
        const school = yield __1.prisma.school.findUnique({
            where: { id: schoolId },
            include: {
                Grade: {
                    include: {
                        _count: { select: { students: true } },
                    },
                    orderBy: { grade: "asc" }
                },
            },
        });
        if (!school) {
            res.status(400).json({ success: false, message: "school not found" });
            return;
        }
        const grades = school.Grade;
        res.status(200).json({ success: true, grades: grades });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: "internal server error" });
    }
});
exports.getGradesBySchoolHandler = getGradesBySchoolHandler;
const getSchoolByIdHandler = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { schoolId } = req.params;
        const school = yield __1.prisma.school.findUnique({ where: { id: schoolId } });
        if (!school) {
            res.status(400).json({ success: false, message: "school not found" });
            return;
        }
        res.status(200).json({ success: true, school });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: "internal server error" });
    }
});
exports.getSchoolByIdHandler = getSchoolByIdHandler;
