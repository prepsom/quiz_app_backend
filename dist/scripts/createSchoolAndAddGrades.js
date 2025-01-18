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
const __1 = require("..");
const constants_1 = require("../constants");
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
        throw new Error("Failed to create school and add grades ");
    }
});
// 0          1                    2
// node dist/scripts/filename.js schoolName
createSchoolAndAddGrades(process.argv[2])
    .then(() => console.log("Successfully created school and added grades 1-12"))
    .catch((e) => process.exit(1));
