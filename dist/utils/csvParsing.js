"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.readCsvStream = void 0;
const csv_parse_1 = require("csv-parse");
const fs_1 = __importDefault(require("fs"));
const readCsvStream = (filePath) => {
    const results = [];
    return new Promise((resolve, reject) => {
        fs_1.default.createReadStream(filePath)
            .pipe((0, csv_parse_1.parse)({
            columns: true,
            skip_empty_lines: true,
        }))
            .on('data', (data) => {
            // Only push rows where at least one field has content
            if (Object.values(data).some((value) => typeof value === 'string' && value.trim() !== "")) {
                results.push(data);
            }
        })
            .on('end', () => resolve(results))
            .on('error', reject);
    });
};
exports.readCsvStream = readCsvStream;
