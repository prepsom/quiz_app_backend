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
dbInit()
    .then(() => console.log("DB initialized with default school and grade successfully"))
    .catch((e) => {
    console.log("FAILED TO INITIALIZE DB");
    process.exit(1);
});
