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
exports.deleteSubjectHandler = exports.addSubjectByGradeHandler = exports.getSubjectsByGradeHandler = void 0;
const __1 = require("..");
const getSubjectsByGradeHandler = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // get auth userid from middleware
    // get user with the grade he/she is in 
    // once we have the grade , we fetch for the subjects by the grade
    // return subjects
    try {
        const { gradeId } = req.params;
        const userId = req.userId;
        if (!userId) {
            res.status(401).json({
                "success": false,
                "message": 'authenticated user id not found'
            });
            return;
        }
        const user = yield __1.prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            res.status(400).json({
                "success": false,
                "message": "invalid user id"
            });
            return;
        }
        // endpoint to get subjects under a specific grade
        // if the user is a student and if belongs to the grade then show the subjects
        // if the user is a teacher and if teaches the grade then show the subjects
        if (user.role === "STUDENT") {
            if (user.gradeId !== gradeId) {
                res.status(401).json({
                    "success": false,
                    "message": "user unauthorized to get subjects under this grade"
                });
                return;
            }
        }
        if (user.role === "TEACHER") {
            const teachesGrade = yield __1.prisma.teacherGrade.findFirst({ where: { teacherId: user.id, gradeId: gradeId } });
            if (!teachesGrade) {
                res.status(401).json({
                    "success": false,
                    "message": "teacher unauthorized to get subjects under this grade"
                });
                return;
            }
        }
        const subjects = yield __1.prisma.subject.findMany({ where: { gradeId: gradeId } });
        res.status(200).json({
            "success": true,
            subjects,
        });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({
            "success": false,
            "message": "Internal server error when getting subjects"
        });
    }
});
exports.getSubjectsByGradeHandler = getSubjectsByGradeHandler;
const addSubjectByGradeHandler = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // get userId from req (added by middleware) to get the auth user id 
        const userId = req.userId;
        if (!userId) {
            res.status(401).json({
                "success": false,
                "message": 'authenticated user id not found'
            });
            return;
        }
        const user = yield __1.prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            res.status(400).json({
                "success": false,
                "message": "invalid user id"
            });
            return;
        }
        // check role of the user - either ADMIN OR TEACHER
        if (user.role === "STUDENT") {
            res.status(401).json({
                "success": false,
                "message": "user not authorized to create a subject"
            });
            return;
        }
        // if role== teacher   , check if teacher teaches that grade they are trying to add a subject to
        const { gradeId, subjectName } = req.body;
        const grade = yield __1.prisma.grade.findUnique({ where: { id: gradeId } });
        if (!grade) {
            res.status(404).json({
                "success": false,
                "message": "grade not found"
            });
            return;
        }
        // check if role===TEACHER that teacher teaches this grade , if he/she doesn't then can't add subject in this grade
        if (user.role === "TEACHER") {
            const teacherGrade = yield __1.prisma.teacherGrade.findFirst({ where: { teacherId: user.id, gradeId: grade.id } });
            if (!teacherGrade) {
                res.status(401).json({
                    "success": false,
                    "message": "teacher doesn't teach this grade. unauthorized to add a subject"
                });
                return;
            }
        }
        const newSubject = yield __1.prisma.subject.create({ data: { subjectName: subjectName.trim(), gradeId: grade.id } });
        res.status(201).json({
            "success": true,
            "subject": newSubject,
        });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ "success": false, "message": "internal server error when adding subject" });
    }
});
exports.addSubjectByGradeHandler = addSubjectByGradeHandler;
const deleteSubjectHandler = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // get subject id to delete from params
        // check if subject exists
        // check user's role
        // delete subject
        const { subjectId } = req.params;
        const userId = req.userId;
        if (!userId) {
            res.status(401).json({
                "success": false,
                "message": 'authenticated user id not found'
            });
            return;
        }
        const user = yield __1.prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            res.status(400).json({
                "success": false,
                "message": "invalid user id"
            });
            return;
        }
        if (user.role === "STUDENT") {
            res.status(401).json({
                "success": false,
                "message": "user not authorized to delete subjects"
            });
            return;
        }
        // if role == teacher then if teacher teaches the grade that this subject is in then its ok for the teacher to delete the subject
        const subject = yield __1.prisma.subject.findUnique({ where: { id: subjectId } });
        if (!subject) {
            res.status(400).json({
                "success": false,
                "message": "subject not found"
            });
            return;
        }
        if (user.role === "TEACHER") {
            const subjectGradeId = subject.gradeId;
            const teachesGrade = yield __1.prisma.teacherGrade.findFirst({ where: { teacherId: user.id, gradeId: subjectGradeId } });
            if (!teachesGrade) {
                res.status(401).json({
                    "success": false,
                    "message": "teacher doesn't teach this grade. unauthorized to delete a subject"
                });
                return;
            }
        }
        yield __1.prisma.subject.delete({ where: { id: subject.id } });
        res.status(200).json({
            "success": true,
            "message": "subject deleted successfully"
        });
    }
    catch (error) {
        console.log(error);
    }
});
exports.deleteSubjectHandler = deleteSubjectHandler;
