import {parse} from "csv-parse"
import fs from "fs"


const readCsvStream = (filePath: string) => {
    const results: any = [];

    return new Promise((resolve, reject) => {
        fs.createReadStream(filePath)
            .pipe(parse({
                columns: true,
                skip_empty_lines: true,
            }))
            .on('data', (data) => {
                // Only push rows where at least one field has content
                if (Object.values(data).some((value) => typeof value === 'string' && value.trim() !=="")) {
                    results.push(data);
                }
            })
            .on('end', () => resolve(results))
            .on('error', reject);
    });
}


export {
    readCsvStream,
}