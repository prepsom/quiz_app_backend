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
const questionsCsvParsing_1 = require("../utils/questionsCsvParsing");
const isMCQQuestion = (data) => {
    return data.questionType === "MCQ";
};
const isFillBlankQuestion = (data) => {
    return data.questionType === "FILL_IN_BLANK";
};
const isMatchingQuestion = (data) => {
    return data.questionType === "MATCHING";
};
const validateReadyField = (requestData) => {
    var _a;
    if (isFillBlankQuestion(requestData)) {
        // Fill in the blank: At least one blank segment and corresponding answers
        if (!requestData.segments || requestData.segments.length === 0)
            return false;
        const blankIndices = requestData.segments
            .map((segment, index) => (segment.isBlank ? index : -1))
            .filter((index) => index !== -1);
        const blankIndicesLength = blankIndices.length;
        const possibleAnswersIndices = blankIndices.map((_, index) => index);
        // [1,2]
        // [0,1]
        const validAnswers = requestData.answers && requestData.answers.length > 0;
        const allAnswersMatchBlanks = (_a = requestData.answers) === null || _a === void 0 ? void 0 : _a.every((answer) => possibleAnswersIndices.includes(answer.blankIndex));
        return validAnswers && allAnswersMatchBlanks;
    }
    else if (isMatchingQuestion(requestData)) {
        // Matching: Ensure at least 3 valid pairs
        return requestData.pairs && requestData.pairs.length >= 3;
    }
    return false; // Default to not ready for unrecognized question types
};
const createQuestionsInLevel = (levelId, csvPath) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const level = yield __1.prisma.level.findUnique({ where: { id: levelId } });
        if (!level) {
            throw new Error(`Level with id ${levelId} not found`);
        }
        const exampleQuestionsData = (0, questionsCsvParsing_1.parseQuestionsCsv)(csvPath);
        const questionsData = exampleQuestionsData.map((question) => (Object.assign(Object.assign({}, question), { levelId: level.id })));
        for (const question of questionsData) {
            const isReady = validateReadyField(question);
            switch (question.questionType) {
                case "MCQ":
                    // create mcq question in database
                    // create question , add answers to the question
                    // update question ready status to true once the question has 4 possible answers and one of them is true
                    const isMcqReady = (question) => {
                        if (question.mcqAnswers.length < 4)
                            return false;
                        let isCorrectCounterActual = 0;
                        let isCorrectCountRequired = 1;
                        for (const answer of question.mcqAnswers) {
                            if (answer.isCorrect) {
                                isCorrectCounterActual++;
                            }
                        }
                        if (isCorrectCounterActual !== isCorrectCountRequired) {
                            return false;
                        }
                        return true;
                    };
                    yield __1.prisma.question.create({
                        data: {
                            questionTitle: question.questionTitle,
                            questionType: question.questionType,
                            explanation: question.explanation,
                            difficulty: question.difficulty,
                            levelId: level.id,
                            ready: isMcqReady(question),
                            MCQAnswers: {
                                createMany: {
                                    data: question.mcqAnswers,
                                },
                            },
                        },
                    });
                    console.log(`${question.questionType} question created`);
                    break;
                case "FILL_IN_BLANK":
                    // create fill in blank question in db
                    yield __1.prisma.question.create({
                        data: {
                            questionTitle: question.questionTitle,
                            explanation: question.explanation,
                            difficulty: question.difficulty,
                            levelId: level.id,
                            questionType: question.questionType,
                            ready: isReady,
                            BlankSegments: {
                                createMany: {
                                    data: question.segments,
                                },
                            },
                            BlankAnswers: {
                                createMany: {
                                    data: question.answers,
                                },
                            },
                        },
                    });
                    console.log(`${question.questionType} question created`);
                    break;
                case "MATCHING":
                    //create matching question in db
                    yield __1.prisma.question.create({
                        data: {
                            questionTitle: question.questionTitle,
                            explanation: question.explanation,
                            questionType: question.questionType,
                            levelId: level.id,
                            difficulty: question.difficulty,
                            ready: isReady,
                            MatchingPairs: {
                                createMany: {
                                    data: question.pairs.map((pair, index) => {
                                        return {
                                            leftItem: pair.leftItem,
                                            rightItem: pair.rightItem,
                                            order: index,
                                        };
                                    }),
                                },
                            },
                        },
                    });
                    console.log(`${question.questionType} question created`);
                    break;
            }
        }
    }
    catch (error) {
        console.log(error);
        throw new Error("Failed to add questions in level");
    }
});
// process.argv[2] being the command line argument for a particular level
createQuestionsInLevel(process.argv[2], process.argv[3])
    .then(() => {
    console.log("Successfully added questions in level");
})
    .catch((e) => {
    console.log(e);
    process.exit(1);
});
/*
fill in the blank question creation request body

Example for :-

"______ is the process by which plants use sunlight to create oxygen and food"

{
    "questionTitle": "Complete the sentence about photosynthesis",
    "difficulty": "MEDIUM",
    "levelId": "ff4085e8-fd7b-4692-83cf-56d3a49dd64e",
    "explanation": "Plants use sunlight, carbon dioxide, and water to produce glucose and oxygen through photosynthesis.",
    "questionType":"FILL_IN_BLANK",
    "segments": [
        {
            "text":"asdasdas",
            isBlank:false,
            order:0,
        }
        {
            "text": "Photosynthesis",
            "isBlank": true,
            "order": 1
        },
        {
            "text": "is the process by which plants use sunlight to create oxygen and food",
            "isBlank": false,
            "order": 2
        }
    ],
    "answers": [
        {
            "value": "photosynthesis",
            "blankIndex": 1,
        }
    ]
}


Match the following type question creation request body

{
    "questionTitle": "Complete the sentence about photosynthesis",
    "questionHint": "Think about what plants need for photosynthesis",
    "difficulty": "MEDIUM",
    "levelId": "ff4085e8-fd7b-4692-83cf-56d3a49dd64e",
    "explanation": "Plants use sunlight, carbon dioxide, and water to produce glucose and oxygen through photosynthesis.",
    "questionType":"MATCHING",
    "pairs":[
        {
            "leftItem":"left item 1",
            "rightItem":"right item 1"
        },
        {
            "leftItem":"left item 2",
            "rightItem":"right item 2"
        },
        {
            "leftItem":"left item 3",
            "rightItem":"right item 3"
        },
        {
            "leftItem":"left item 4",
            "rightItem":"right item 4"
        }
    ]
}

*/
