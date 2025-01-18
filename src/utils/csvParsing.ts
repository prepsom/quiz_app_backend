import { parse } from "csv-parse";
import fs from "fs";
import path from "path";

interface CSVRow {
  // Add your expected column types here
  Timestamp: string;
  "Full Name": string;
  "Email ID (for Login)": string;
  "Contact Number (for login)": number;
  Gender: "Male" | "Female";
  "School Name": string;
}

const readCSVFile = async (filePath: string): Promise<CSVRow[]> => {
  return new Promise((resolve, reject) => {
    const results: CSVRow[] = [];

    // Create a readable stream from the CSV file
    const fileStream = fs.createReadStream(path.resolve(filePath));

    // Configure the parser
    const parser = parse({
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
};

export { readCSVFile, CSVRow };
