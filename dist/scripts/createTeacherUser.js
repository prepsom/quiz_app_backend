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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bcrypt_1 = __importDefault(require("bcrypt"));
const __1 = require("..");
const createTeacherUser = (email, password, name, avatar, schoolName, grades) => __awaiter(void 0, void 0, void 0, function* () {
    // create a user with role teacher in grades for ex (8,9,10) of the school with name "schoolName"
    // 1. check if the user with email already exists
    // 2.check if school with name "schoolName" exists
    // check if the grades in the school have grades 8,9,10 
    // get their gradeids
    // create a user with role teache in the grades with gradeids
    const existingUser = yield __1.prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
    if (existingUser) {
        throw new Error("User with email already exists");
    }
    const school = yield __1.prisma.school.findFirst({ where: { schoolName: schoolName.trim() }, include: {
            Grade: true,
        } });
    if (!school) {
        throw new Error(`School with name ${schoolName.trim()} doesn't exist`);
    }
    const teacherGrades = grades;
    const teacherGradeIds = school.Grade.filter((grade) => teacherGrades.includes(grade.grade)).map((grade) => grade.id);
    const salt = yield bcrypt_1.default.genSalt(10);
    const hashedPassword = yield bcrypt_1.default.hash(password, salt);
    const teacher = yield __1.prisma.user.create({
        data: {
            email: email.trim().toLowerCase(),
            password: hashedPassword,
            avatar: avatar,
            name: name.trim(),
            role: "TEACHER",
            schoolName: school.schoolName,
            teacherGrades: {
                createMany: {
                    data: teacherGradeIds.map((gradeId) => {
                        return {
                            gradeId: gradeId,
                        };
                    })
                }
            },
        }
    });
});
createTeacherUser(process.argv[2], process.argv[3], process.argv[4], process.argv[5], process.argv[6], [8, 9, 10]).then(() => console.log('ADDED TEACHER')).catch((e) => console.log('FAILED TO ADD TEACHER:- ', e));
