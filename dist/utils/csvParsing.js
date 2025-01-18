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
exports.readCSVFile = void 0;
const csv_parse_1 = require("csv-parse");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const readCSVFile = (filePath) => __awaiter(void 0, void 0, void 0, function* () {
    return new Promise((resolve, reject) => {
        const results = [];
        // Create a readable stream from the CSV file
        const fileStream = fs_1.default.createReadStream(path_1.default.resolve(filePath));
        // Configure the parser
        const parser = (0, csv_parse_1.parse)({
            columns: true, // Use the first line as headers
            skip_empty_lines: true,
            trim: true,
            cast: true, // Automatically convert strings to their proper types
        });
        // Handle parsing events
        parser.on("readable", function () {
            let record;
            while ((record = parser.read()) !== null) {
                results.push(record);
            }
        });
        // Handle parsing completion
        parser.on("end", function () {
            resolve(results);
        });
        // Handle errors
        parser.on("error", function (err) {
            reject(err);
        });
        // Start the parsing process
        fileStream.pipe(parser);
    });
});
exports.readCSVFile = readCSVFile;
