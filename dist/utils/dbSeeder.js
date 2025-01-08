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
exports.dbInit = dbInit;
exports.seedUsers = seedUsers;
const __1 = require("..");
const constants_1 = require("../constants");
const bcrypt_1 = __importDefault(require("bcrypt"));
function isGradesDbEmpty() {
    return __awaiter(this, void 0, void 0, function* () {
        const gradesCount = yield __1.prisma.grade.count();
        return gradesCount === 0;
    });
}
function dbInit() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const isGradesEmpty = yield isGradesDbEmpty();
            if (!isGradesEmpty) {
                console.log('GRADES ALREADY SEEDED');
                return;
            }
            yield __1.prisma.grade.createMany({
                data: constants_1.GRADES,
            });
            console.log('GRADES SEEDED SUCCESSFULLY');
        }
        catch (error) {
            console.log('ERROR SEEDING DATABASE ', error);
            throw error;
        }
    });
}
// seed users to a grade 
const seedUserInGrade = (gradeId, email, name, password, role, avatar) => __awaiter(void 0, void 0, void 0, function* () {
    // passwords are in plain string () 
    try {
        const salt = yield bcrypt_1.default.genSalt(10);
        const hashedPassword = yield bcrypt_1.default.hash(password, salt);
        if (role === "STUDENT") {
            yield __1.prisma.user.create({ data: {
                    email: email.trim().toLowerCase(),
                    gradeId: gradeId,
                    avatar: avatar,
                    role: role,
                    name: name,
                    password: hashedPassword,
                } });
        }
        else if (role === "TEACHER") {
            yield __1.prisma.user.create({
                data: {
                    email: email.trim().toLowerCase(),
                    name,
                    password: hashedPassword,
                    role,
                    avatar,
                    teacherGrades: {
                        create: {
                            gradeId
                        }
                    }
                }
            });
        }
        console.log('successfully seeded user in database');
    }
    catch (error) {
        console.log('FAILED TO SEED USER IN DATABASE :- ', error);
        throw error;
    }
});
// seed multiple users
function seedUsers(gradeNo) {
    return __awaiter(this, void 0, void 0, function* () {
        const seeded = yield __1.prisma.settings.findUnique({
            where: { key: "usersSeeded" },
        });
        if (seeded) {
            console.log("Users already seeded. Skipping...");
            return;
        }
        const grade = yield __1.prisma.grade.findFirst({ where: { grade: gradeNo } });
        if (!grade) {
            console.log(`grade ${gradeNo} doesn't exist in DB`);
            return;
        }
        const gradeId = grade.id;
        const users = [
            {
                email: "teacher.smith@school.com",
                name: "John Smith",
                password: "teacher123",
                role: "TEACHER",
                avatar: "MALE"
            },
            {
                email: "sarah.jones@school.com",
                name: "Sarah Jones",
                password: "teach456",
                role: "TEACHER",
                avatar: "FEMALE"
            },
            {
                email: "alice.student@school.com",
                name: "Alice Johnson",
                password: "student123",
                role: "STUDENT",
                avatar: "FEMALE"
            },
            {
                email: "bob.student@school.com",
                name: "Bob Wilson",
                password: "student456",
                role: "STUDENT",
                avatar: "MALE"
            },
            {
                email: "emma.student@school.com",
                name: "Emma Brown",
                password: "student789",
                role: "STUDENT",
                avatar: "FEMALE"
            }
        ];
        try {
            for (const user of users) {
                yield seedUserInGrade(gradeId, user.email, user.name, user.password, user.role, user.avatar);
            }
            console.log('All users seeded successfully');
            yield __1.prisma.settings.create({ data: { key: "usersSeeded", value: "true" } });
        }
        catch (error) {
            console.log('Error seeding users:- ', error);
            throw error;
        }
    });
}
