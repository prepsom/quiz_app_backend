"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseQuestionsCsv = parseQuestionsCsv;
const sync_1 = require("csv-parse/sync");
const fs_1 = __importDefault(require("fs"));
function parseMatchingRow(optionsStr) {
    if (!optionsStr.includes("→")) {
        throw new Error(`Invalid matching format: ${optionsStr}`);
    }
    const [left, right] = optionsStr.split("→").map((part) => part.trim());
    const leftText = left.replace(/^\d+\)/, "").trim();
    const rightText = right.replace(/\([a-z]\)/, "").trim();
    return [leftText, rightText];
}
function parseMCQOption(option) {
    // Remove prefixes like "a) ", "A) ", "a. ", "A. ", etc., and trim whitespace
    return option.replace(/^[a-zA-Z][.)]\s*/, "").trim();
}
function parseQuestionsCsv(filePath) {
    const fileContent = fs_1.default.readFileSync(filePath, "utf-8");
    const records = (0, sync_1.parse)(fileContent, {
        columns: true,
        skip_empty_lines: true,
    });
    const questions = [];
    let currentQuestion = null;
    let currentOptions = [];
    let currentMatches = [];
    for (let i = 0; i < records.length; i++) {
        const row = records[i];
        if (row.Difficulty && row["Question Type"] && row.Question) {
            if (currentQuestion) {
                questions.push(processQuestion(currentQuestion, currentOptions, currentMatches));
                currentOptions = [];
                currentMatches = [];
            }
            if (row["Question Type"] === "True/False") {
                currentQuestion = null;
                continue;
            }
            if (row["Question Type"] === "Diagram-Based") {
                currentQuestion = null;
                continue;
            }
            currentQuestion = {
                difficulty: row.Difficulty.toUpperCase(),
                questionType: mapQuestionType(row["Question Type"]),
                questionTitle: row.Question,
                explanation: row.Explanation || "",
                answer: row.Answer,
                isFirstRow: true,
            };
            if (row.Options && row.Options !== "-") {
                if (currentQuestion.questionType === "MCQ") {
                    currentOptions.push(row.Options);
                }
                else if (currentQuestion.questionType === "MATCHING") {
                    try {
                        const [left, right] = parseMatchingRow(row.Options);
                        currentMatches.push([left, right]);
                    }
                    catch (error) {
                        console.error(`Error parsing matching row: ${row.Options}`, error);
                    }
                }
            }
        }
        else if (currentQuestion && row.Options) {
            if (currentQuestion.questionType === "MCQ") {
                currentOptions.push(row.Options);
            }
            else if (currentQuestion.questionType === "MATCHING") {
                try {
                    const [left, right] = parseMatchingRow(row.Options);
                    currentMatches.push([left, right]);
                }
                catch (error) {
                    console.error(`Error parsing matching row: ${row.Options}`, error);
                }
            }
        }
    }
    if (currentQuestion) {
        questions.push(processQuestion(currentQuestion, currentOptions, currentMatches));
    }
    return transformToExampleData(questions);
}
function processQuestion(question, options, matches) {
    switch (question.questionType) {
        case "MCQ":
            // Get the clean answer text without the letter prefix
            const correctAnswer = parseMCQOption(question.answer || "");
            // Ensure we have exactly 4 options
            if (options.length !== 4) {
                console.warn(`MCQ question "${question.questionTitle}" has ${options.length} options instead of 4`);
            }
            const mcqAnswers = options.map((opt) => {
                const value = parseMCQOption(opt);
                return {
                    value,
                    isCorrect: value.toLowerCase() === correctAnswer.toLowerCase(),
                };
            });
            // Verify we have exactly one correct answer
            const correctAnswers = mcqAnswers.filter((answer) => answer.isCorrect);
            if (correctAnswers.length !== 1) {
                console.warn(`MCQ question "${question.questionTitle}" has ${correctAnswers.length} correct answers instead of 1`);
            }
            return Object.assign(Object.assign({}, question), { options: mcqAnswers });
        case "MATCHING":
            return Object.assign(Object.assign({}, question), { matches });
        default:
            return question;
    }
}
function transformToExampleData(parsedQuestions) {
    return parsedQuestions.map((q) => {
        const baseQuestion = {
            questionTitle: q.questionTitle,
            difficulty: q.difficulty,
            levelId: "",
            explanation: q.explanation,
            questionType: q.questionType,
        };
        switch (q.questionType) {
            case "MCQ":
                // Ensure all MCQ requirements are met
                const mcqAnswers = q.options || [];
                const hasCorrectNumberOfAnswers = mcqAnswers.length === 4;
                const hasOneCorrectAnswer = mcqAnswers.filter((a) => a.isCorrect).length === 1;
                return Object.assign(Object.assign({}, baseQuestion), { mcqAnswers, ready: hasCorrectNumberOfAnswers && hasOneCorrectAnswer });
            case "FILL_IN_BLANK":
                const parts = q.questionTitle.split("______");
                const segments = [];
                let blankIndex = -1;
                for (let i = 0; i < parts.length; i++) {
                    if (parts[i]) {
                        segments.push({
                            text: parts[i],
                            isBlank: false,
                            order: segments.length,
                        });
                    }
                    if (i < parts.length - 1) {
                        blankIndex = segments.length;
                        segments.push({
                            text: q.answer,
                            isBlank: true,
                            order: segments.length,
                        });
                    }
                }
                return Object.assign(Object.assign({}, baseQuestion), { segments, answers: [
                        {
                            value: q.answer,
                            blankIndex: 0,
                        },
                    ] });
            case "MATCHING":
                return Object.assign(Object.assign({}, baseQuestion), { pairs: q.matches.map(([leftItem, rightItem]) => ({
                        leftItem,
                        rightItem,
                    })) });
            default:
                throw new Error(`Unsupported question type: ${q.questionType}`);
        }
    });
}
function mapQuestionType(type) {
    const typeMap = {
        MCQ: "MCQ",
        "Fill in the blank": "FILL_IN_BLANK",
        "Match the Following": "MATCHING",
    };
    return typeMap[type] || type;
}
