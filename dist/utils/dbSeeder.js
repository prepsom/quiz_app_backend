"use strict";
// when the server initially starts up for the first time , we
// need to create a default school if not already created.
// once created , we need to add grades from 1 - 12 in the said school.
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
exports.seedUsersInGrade = exports.createSchoolAndAddGrades = exports.dbInit = void 0;
const __1 = require("..");
const constants_1 = require("../constants");
const bcrypt_1 = __importDefault(require("bcrypt"));
// dbInit function adds default school if it doesn't exist and then adds grades to it.
const dbInit = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // check if default school exists
        const existingSchool = yield __1.prisma.school.findFirst({
            where: { schoolName: "PrepSOM School" },
        });
        if (existingSchool !== null) {
            return;
        }
        const school = yield __1.prisma.school.create({ data: {} });
        // once school is created , add grades (1 - 12) to said school
        for (const grade of constants_1.GRADES) {
            try {
                yield __1.prisma.grade.create({
                    data: {
                        grade: grade.grade,
                        schoolId: school.id,
                    },
                });
            }
            catch (error) {
                console.log(`FAILED TO ADD grade ${grade.grade} in school ${school.schoolName}`);
                throw new Error("database initialization failed");
            }
        }
        // grades added in the default school
        console.log("DEFAULT SCHOOL AND GRADES INITIALIZED SUCCESSFULLY");
    }
    catch (error) {
        console.log(error);
    }
});
exports.dbInit = dbInit;
// create a script to add a school to the schools database and after
// adding it create grades in the newly created school.
const createSchoolAndAddGrades = (schoolName) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const existingSchool = yield __1.prisma.school.findFirst({
            where: { schoolName: schoolName.trim() },
        });
        if (existingSchool) {
            console.log(`SCHOOL with name ${schoolName.trim()} already exists`);
            return;
        }
        const school = yield __1.prisma.school.create({
            data: { schoolName: schoolName.trim() },
        });
        for (const grade of constants_1.GRADES) {
            try {
                const gradeNumber = grade.grade;
                yield __1.prisma.grade.create({
                    data: { grade: gradeNumber, schoolId: school.id },
                });
            }
            catch (error) {
                console.log(error);
                throw new Error(`FAILED TO ADD grade ${grade.grade} to ${school.schoolName}`);
            }
        }
        console.log(`CREATED SCHOOL ${school.schoolName} and added grades 1 to 12 to it`);
    }
    catch (error) {
        console.log(error);
    }
});
exports.createSchoolAndAddGrades = createSchoolAndAddGrades;
const seedUserInGrades = (gradeIdArr, email, name, password, role, avatar) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const salt = yield bcrypt_1.default.genSalt(10);
        const hashedPassword = yield bcrypt_1.default.hash(password, salt);
        let user;
        if (role === "STUDENT") {
            if (gradeIdArr.length > 1) {
                console.log("USER CANNOT HAVE MORE THAN 1 GRADE");
                return;
            }
            user = yield __1.prisma.user.create({
                data: {
                    email: email.trim().toLowerCase(),
                    password: hashedPassword,
                    avatar: avatar,
                    gradeId: gradeIdArr[0],
                    name: name,
                    role: role,
                },
            });
            console.log(`${user.role} with email ${user.email} added`);
        }
        else if (role === "TEACHER") {
            // create a entry in users table along with
            // a teacher can teach multiple grades.
            user = yield __1.prisma.user.create({
                data: {
                    email: email.trim().toLowerCase(),
                    password: hashedPassword,
                    avatar: avatar,
                    name: name,
                    role: role,
                    teacherGrades: {
                        createMany: {
                            data: gradeIdArr.map((gradeId) => {
                                return {
                                    gradeId: gradeId,
                                };
                            }),
                        },
                    },
                },
            });
            console.log(`${user.role} with email ${user.email} added`);
        }
        else {
            user = yield __1.prisma.user.create({
                data: {
                    email: email.trim().toLowerCase(),
                    name: name,
                    password: hashedPassword,
                    avatar: avatar,
                    role: role,
                },
            });
            console.log(`${user.role} with ${user.email} added`);
        }
    }
    catch (error) {
        console.log("FAILED TO SEED USER IN THE DATABASE:- ", error);
    }
});
// seed users in a school in a particular grade ()
const seedUsersInGrade = (gradeNumber, schoolName) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // seeding users in a particular school's grade
        // get school with the particular school name (it should be exact)
        // get a grade with the particular gradeNumber mentioned (example 4) in the school
        // add users in the selected grade
        const school = yield __1.prisma.school.findFirst({
            where: { schoolName: schoolName.trim() },
        });
        if (!school) {
            console.log(`SCHOOL with ${schoolName} not found to seed users in`);
            return;
        }
        const grade = yield __1.prisma.grade.findFirst({
            where: { schoolId: school.id, grade: gradeNumber },
        });
        if (!grade) {
            console.log(`GRADE ${gradeNumber} in ${school.schoolName} not found`);
            return;
        }
        // add list of users
        const usersList = [
            {
                email: "alice.student@school.com",
                name: "Alice Johnson",
                password: "student123",
                role: "STUDENT",
                avatar: "FEMALE",
                gradeId: grade.id,
            },
            {
                email: "bob.student@school.com",
                name: "Bob Johnson",
                password: "student456",
                role: "STUDENT",
                avatar: "MALE",
                gradeId: grade.id,
            },
            {
                email: "sarah.smith@school.com",
                name: "Sarah Smith",
                password: "secure789",
                role: "STUDENT",
                avatar: "FEMALE",
                gradeId: grade.id,
            },
            {
                email: "michael.chen@school.com",
                name: "Michael Chen",
                password: "secure101",
                role: "STUDENT",
                avatar: "MALE",
                gradeId: grade.id,
            },
            {
                email: "emma.davis@school.com",
                name: "Emma Davis",
                password: "secure202",
                role: "TEACHER",
                avatar: "FEMALE",
                gradeId: grade.id,
            },
            {
                email: "james.wilson@school.com",
                name: "James Wilson",
                password: "secure303",
                role: "STUDENT",
                avatar: "MALE",
                gradeId: grade.id,
            },
            {
                email: "diana.brown@school.com",
                name: "Diana Brown",
                password: "secure404",
                role: "ADMIN",
                avatar: "FEMALE",
            },
        ];
        for (const user of usersList) {
            try {
                yield seedUserInGrades(user.gradeId !== undefined ? [user.gradeId] : [], user.email, user.name, user.password, user.role, user.avatar);
            }
            catch (error) {
                console.log(error);
                throw new Error(`FAILED to seed user with email  ${user.email} in DB`);
            }
        }
        console.log(`SEEDED USERS IN GRADE ${gradeNumber} in school ${schoolName}`);
    }
    catch (error) {
        console.log("FAILED TO SEED USERS IN DATABASE :- ", error);
    }
});
exports.seedUsersInGrade = seedUsersInGrade;
