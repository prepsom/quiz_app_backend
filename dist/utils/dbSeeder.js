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
exports.seedLevelsInSubject = void 0;
exports.dbInit = dbInit;
exports.seedUsers = seedUsers;
const __1 = require("..");
const constants_1 = require("../constants");
const bcrypt_1 = __importDefault(require("bcrypt"));
const csvParsing_1 = require("./csvParsing");
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
const seedUserInGrade = (gradeId, email, name, password, role) => __awaiter(void 0, void 0, void 0, function* () {
    // passwords are in plain string () 
    try {
        const salt = yield bcrypt_1.default.genSalt(10);
        const hashedPassword = yield bcrypt_1.default.hash(password, salt);
        if (role === "STUDENT") {
            yield __1.prisma.user.create({ data: {
                    email: email.trim().toLowerCase(),
                    gradeId: gradeId,
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
function seedUsers(gradeNo, filePath) {
    return __awaiter(this, void 0, void 0, function* () {
        const grade = yield __1.prisma.grade.findFirst({ where: { grade: gradeNo } });
        if (!grade) {
            console.log(`grade ${gradeNo} doesn't exist in DB`);
            return;
        }
        const gradeId = grade.id;
        // read from csv files to add users in a grade 
        const usersData = yield (0, csvParsing_1.readCsvStream)(filePath);
        const users = usersData.map((userData) => {
            return {
                // email , name , password , role
                "email": userData["Email ID"],
                "name": userData["Full Name"],
                "password": "1234@#A",
                "role": "STUDENT",
            };
        });
        try {
            for (const user of users) {
                const existingUser = yield __1.prisma.user.findUnique({
                    where: { email: user.email.trim().toLowerCase() }
                });
                if (!existingUser) {
                    yield seedUserInGrade(gradeId, user.email, user.name, user.password, user.role);
                    console.log(`Seeded new user:- ${user.email}`);
                }
                else {
                    console.log(`Skipping existing user:- ${user.email}`);
                }
            }
            console.log('All users seeded successfully');
        }
        catch (error) {
            console.log('Error seeding users:- ', error);
            throw error;
        }
    });
}
const seedLevelInSubject = (subjectId, levelName, levelPassingQuestions) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const highestPosition = yield __1.prisma.level.findMany({ where: { subjectId: subjectId }, orderBy: {
                position: "desc"
            }, take: 1 }).then(levels => { var _a, _b; return (_b = (_a = levels[0]) === null || _a === void 0 ? void 0 : _a.position) !== null && _b !== void 0 ? _b : -1; });
        const newLevel = yield __1.prisma.level.create({ data: { levelName: levelName, passingQuestions: levelPassingQuestions, position: highestPosition + 1, subjectId: subjectId } });
        console.log('LEVEL CREATED WITH ID :- ', newLevel.id);
    }
    catch (error) {
        console.log('FAILED TO ADD LEVEL IN DB');
    }
});
const seedLevelsInSubject = (subjectId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const subject = yield __1.prisma.subject.findUnique({ where: { id: subjectId } });
        if (!subject) {
            console.log("Subject doesn't exist to add level in");
            return;
        }
        const levels = [
            {
                levelName: "Control and Coordination",
                passingQuestions: 5,
            },
            {
                levelName: "How Do Organisms Reproduce?",
                passingQuestions: 5,
            },
            {
                levelName: "Heredity and Evolution",
                passingQuestions: 5,
            },
            {
                levelName: "Our Environment",
                passingQuestions: 5,
            },
            {
                levelName: "Sustainable Management of Natural Resources",
                passingQuestions: 5,
            }
        ];
        for (let i = 0; i < levels.length; i++) {
            const level = levels[i];
            yield seedLevelInSubject(subject.id, level.levelName, level.passingQuestions);
        }
    }
    catch (error) {
        console.log('FAILED TO INSERT LEVELS IN DB :- ', error);
        throw error;
    }
});
exports.seedLevelsInSubject = seedLevelsInSubject;
