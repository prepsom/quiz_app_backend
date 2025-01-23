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
exports.seedSubjectsInGrade = void 0;
const __1 = require("..");
const seedSubjectsInGrade = (gradeNumber, schoolName) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const school = yield __1.prisma.school.findFirst({
            where: { schoolName: schoolName.trim() },
        });
        if (!school) {
            console.log(`School with ${schoolName.trim()} not found`);
            return;
        }
        const grade = yield __1.prisma.grade.findFirst({
            where: { grade: gradeNumber, schoolId: school.id },
        });
        if (!grade) {
            console.log(`Grade ${gradeNumber} not found`);
            return;
        }
        const subjects = ["Science", "Mathematics"];
        yield __1.prisma.subject.createMany({
            data: subjects.map((subject) => {
                return {
                    subjectName: subject,
                    gradeId: grade.id,
                };
            }),
        });
        console.log(`Subjects added in grade with id ${grade.id}`);
    }
    catch (error) {
        console.log(error);
        throw new Error(`failed to add subjects in grade ${gradeNumber}`);
    }
});
exports.seedSubjectsInGrade = seedSubjectsInGrade;
(0, exports.seedSubjectsInGrade)(parseInt(process.argv[2]), process.argv[3])
    .then(() => console.log("SUBJECTS SUCCESSFULLY ADDED IN GRADE"))
    .catch((e) => process.exit(1));
