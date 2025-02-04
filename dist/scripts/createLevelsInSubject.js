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
                levelName: "Nutrition in Plants",
                levelDescription: "",
                passingQuestions: 6,
            },
            {
                levelName: "Nutrition in Animals",
                levelDescription: "",
                passingQuestions: 6,
            },
            {
                levelName: "Fibre to Fabric",
                levelDescription: "",
                passingQuestions: 6,
            },
            {
                levelName: "Heat",
                levelDescription: "",
                passingQuestions: 6,
            },
            {
                levelName: "Acids, Bases and Salts",
                levelDescription: "",
                passingQuestions: 6,
            },
            {
                levelName: "Physical and Chemical Changes",
                levelDescription: "",
                passingQuestions: 6,
            },
            {
                levelName: "Weather,Climate and Adaptation",
                levelDescription: "",
                passingQuestions: 6,
            },
            {
                levelName: "Winds,Storms and Cyclones",
                levelDescription: "",
                passingQuestions: 6,
            },
            {
                levelName: "Soil",
                levelDescription: "",
                passingQuestions: 6,
            },
            {
                levelName: "Respiration in Organisms",
                levelDescription: "",
                passingQuestions: 6,
            },
            {
                levelName: "Transportation in Animals,Plant",
                levelDescription: "",
                passingQuestions: 6,
            },
            {
                levelName: "Reproduction in Plants",
                levelDescription: "",
                passingQuestions: 6,
            },
            {
                levelName: "Motion and Time",
                levelDescription: "",
                passingQuestions: 6,
            },
            {
                levelName: "Electric Current and its Effect",
                levelDescription: "",
                passingQuestions: 6,
            },
            {
                levelName: "Light",
                levelDescription: "",
                passingQuestions: 6,
            },
            {
                levelName: "Water a Precious Resource",
                levelDescription: "",
                passingQuestions: 6,
            },
            {
                levelName: "Forests Our Lifeline",
                levelDescription: "",
                passingQuestions: 6,
            },
            {
                levelName: "Wastewater Story",
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
