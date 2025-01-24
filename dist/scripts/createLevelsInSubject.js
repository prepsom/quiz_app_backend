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
const createLevelsInSubject = (subjectId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const subject = yield __1.prisma.subject.findUnique({
            where: { id: subjectId },
        });
        if (!subject) {
            throw new Error(`Subject with id ${subjectId} not found`);
            return;
        }
        // if levels already in subject then get highest level , levle with highest position
        const highestLevel = yield __1.prisma.level.findMany({
            where: { subjectId: subject.id },
            orderBy: { position: "desc" },
            take: 1,
        });
        const highestPosition = highestLevel.length === 1 ? highestLevel[0].position : -1;
        const levelsData = [
            {
                levelName: "Skin",
                levelDescription: "",
                passingQuestions: 6,
            },
            {
                levelName: "Respiratory System",
                levelDescription: "",
                passingQuestions: 6,
            },
            {
                levelName: "Nutrition",
                levelDescription: "",
                passingQuestions: 6,
            },
            {
                levelName: "Digestive system",
                levelDescription: "",
                passingQuestions: 6,
            },
            {
                levelName: "Skeleton",
                levelDescription: "",
                passingQuestions: 6,
            },
        ];
        let currentLevelPosition = highestPosition + 1;
        const dbLevelsData = levelsData.map((levelData) => {
            const returnObject = Object.assign(Object.assign({}, levelData), { position: currentLevelPosition, subjectId: subject.id });
            currentLevelPosition++;
            return returnObject;
        });
        yield __1.prisma.level.createMany({ data: dbLevelsData });
        console.log(`LEVELS added in subject ${subject.subjectName}`);
    }
    catch (error) {
        console.log(`failed to add levels in subject with id ${subjectId}`);
        throw new Error(`failed to add levels in subject with id ${subjectId}`);
    }
});
createLevelsInSubject(process.argv[2])
    .then(() => console.log("SUCCESSFULLY ADDED levels in subject"))
    .catch((e) => {
    console.log(e);
    process.exit(1);
});
