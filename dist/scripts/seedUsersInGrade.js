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
exports.seedUsersInGrade = void 0;
const __1 = require("..");
const bcrypt_1 = __importDefault(require("bcrypt"));
const csvParsing_1 = require("../utils/csvParsing");
const generatePassword_1 = require("../utils/generatePassword");
const emailValidation_1 = require("../utils/emailValidation");
const sendEmail_1 = require("../utils/sendEmail");
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
        yield (0, sendEmail_1.sendEmaiL)(email, password);
        console.log(`email sent to ${email
            .trim()
            .toLowerCase()} for their PrepSOM Login Credentials`);
    }
    catch (error) {
        console.log("FAILED TO SEED USER IN THE DATABASE:- ", error);
    }
});
const readStudentsCsvData = (csvPath) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const data = yield (0, csvParsing_1.readCSVFile)(csvPath);
        const studentsData = data.map((data) => {
            return {
                email: data["Email ID (for Login)"],
                name: data["Full Name"],
                role: "STUDENT",
                avatar: data.Gender === "Male" ? "MALE" : "FEMALE",
            };
        });
        return studentsData;
    }
    catch (error) {
        console.log(error);
    }
});
const seedUsersInGrade = (gradeNumber, schoolName, csvPath) => __awaiter(void 0, void 0, void 0, function* () {
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
        const studentsCsvData = yield readStudentsCsvData(csvPath);
        if (studentsCsvData === undefined)
            throw new Error("Cannot read CSV file in seeding users");
        // add list of users
        const usersList = studentsCsvData.map((studentData) => {
            return {
                email: studentData.email,
                avatar: studentData.avatar,
                name: studentData.name,
                role: studentData.role,
                gradeId: grade.id,
                password: (0, generatePassword_1.generatePassword)(),
            };
        });
        // const testUsers: {
        //   email: string;
        //   password: string;
        //   name: string;
        //   role: "STUDENT" | "TEACHER" | "ADMIN";
        //   avatar: "MALE" | "FEMALE";
        //   gradeId?: string;
        // }[] = [
        //   {
        //     email: "admin123@gmail.com",
        //     avatar: "MALE",
        //     role: "STUDENT",
        //     name: "Dhruv Shetty",
        //     password: "1234@#A",
        //     gradeId: grade.id,
        //   },
        //   {
        //     email: "aman123@gmail.com",
        //     avatar: "MALE",
        //     role: "STUDENT",
        //     name: "Aman Loharuka",
        //     password: "1234@#A",
        //     gradeId: grade.id,
        //   },
        // ];
        // for (const testUser of testUsers) {
        //   usersList.push(testUser);
        // }
        for (const user of usersList) {
            try {
                // check if user with the current user's email already exists in db.
                // if yes then continue to next user.
                // validate email before inserting it in db or checking
                if (!(0, emailValidation_1.validateEmail)(user.email)) {
                    console.log(`INVALID EMAIL , skipping record with invalid email ${user.email}`);
                    continue;
                }
                const existingUser = yield __1.prisma.user.findUnique({
                    where: { email: user.email.trim().toLowerCase() },
                });
                if (existingUser !== null) {
                    console.log(`SKIPPING user with email id ${user.email} as it already exists`);
                    continue;
                }
                yield seedUserInGrades(user.gradeId !== undefined ? [user.gradeId] : [], user.email, user.name, user.password, user.role, user.avatar);
            }
            catch (error) {
                console.log(error);
                throw new Error(`FAILED to seed user with email  ${user.email} in DB`);
            }
        }
        // if here then all users in the usersList were seeded
        // if all seeded successfully then send email to all of them with their login credentials.
        console.log(`SEEDED USERS IN GRADE ${gradeNumber} in school ${schoolName}`);
    }
    catch (error) {
        console.log("FAILED TO SEED USERS IN DATABASE :- ", error);
    }
});
exports.seedUsersInGrade = seedUsersInGrade;
// npm create-users-in-grade 8 schoolName csvPathForStudents
(0, exports.seedUsersInGrade)(parseInt(process.argv[2]), process.argv[3], process.argv[4])
    .then(() => console.log("Sucessfully inserted users in grade of a school"))
    .catch((e) => process.exit(1));
