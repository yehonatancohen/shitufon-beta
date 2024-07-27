import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';
import { ClientsManager } from './ClientsManager';

function convertPhoneNumber(number : string) {
    // Implement phone number conversion logic here
    number = number.replace(/\W/g, '');
    let convertedNumbers;
    if (number.startsWith('0')) {
        convertedNumbers = '+972' + number.substring(1);
    } else if (number.startsWith('+972')) {
        convertedNumbers = number;
    } else if (number.startsWith('972'))
    {
        convertedNumbers = '+' + number;
    } else {
        convertedNumbers = '+972' + number;
    }
    return convertedNumbers;
}

// Function to parse Excel file and extract raw data
function parseExcelFile(filePath: string): any[] {
    // Read the Excel file
    const workbook: XLSX.WorkBook = XLSX.readFile(filePath);

    // Assume you want to read the first sheet
    const sheetName: string = workbook.SheetNames[0];

    // Parse the data from the sheet
    const parsedData: any[] = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1 });

    return parsedData;
}

function findSessionFiles(sessionIds: string[]) {
    let logFiles: string[] = [];
    const logFolderPath = path.join(__dirname, '..', 'logs');
    const files = fs.readdirSync(logFolderPath);
    files.forEach(file => {
        const content = fs.readFileSync(path.join(logFolderPath, file), 'utf8');
        const containsSessionId = sessionIds.some(sessionId => content.includes(sessionId));
        if (containsSessionId) {
            logFiles.push(path.join('logs', file));
        }
    });
    return logFiles;
}

function processFile(allFilesContent: string[]): any[]{
    let allLines = new Set(); // Use a set to automatically remove duplicates

    // Iterate over each file's content
    allFilesContent.forEach(content => {
        const match = content.toString().match(/(?:\+972|0)?(?:-)?(?:5[0-9])(?:-)?(?:\d(?:-)?){7}/g);
        if (match && !allLines.has(match[0])) { // Avoid adding empty lines
            if (match.length > 1) {
                match.forEach((line: any) => {
                    allLines.add(convertPhoneNumber(line));
                });
            }
            else
                allLines.add(convertPhoneNumber(match[0]));
        }
    });

    // Convert the set back into a string, joining with newlines
    const combinedContent: any[] = Array.from(allLines);
    return combinedContent;
}

function getFilesFromFolder(folderName: string) {
    const files = fs.readdirSync(folderName);
    const filePaths = files.map(file => path.join(folderName, file));
    return filePaths;
}

function extractPhoneNumbers(fileNames: string[], exclude: string[], sessionIds: string[] = []): any[]{
    let allFilesContent : any[] = [];
    let excludeContent : any[] = [];
    exclude.push(...findSessionFiles(sessionIds));
    for (let i = 0; i < fileNames.length; i++){
        if (fileNames[i].includes('.xlsx') || fileNames[i].includes('.xls')){
            let data = parseExcelFile(fileNames[i]);
            data.forEach((row: any) => {
                row.forEach((cell: any) => {
                    allFilesContent.push(cell);
                });
            });
        }
        else if (fileNames[i].includes('.txt') || fileNames[i].includes('.csv')){
            let content = fs.readFileSync(fileNames[i], 'utf8');
            allFilesContent.push(content);
        }
        if (!(exclude.length > 0))
            continue;
        for (let i = 0; i < exclude.length; i++){
            if (exclude[i].includes('.xlsx') || exclude[i].includes('.xls')){
                let data = parseExcelFile(exclude[i]);
                data.forEach((row: any) => {
                    row.forEach((cell: any) => {
                        excludeContent.push(cell);
                    });
                });
            }
            else if (exclude[i].includes('.txt') || exclude[i].includes('.csv')){
                let content = fs.readFileSync(exclude[i], 'utf8');
                excludeContent.push(content);
            }
        }
    }
    let fileNumbers = processFile(allFilesContent);
    let totalLoaded = fileNumbers.length;
    let excludeNumbers : any[];
    const initialLength = fileNumbers.length;
    let filteredLength = 0
    if (exclude.length > 0){
        excludeNumbers = processFile(excludeContent);
        fileNumbers = fileNumbers.filter((el) => !excludeNumbers.includes(el));
        filteredLength += fileNumbers.length;
        const numberOfFilteredOut = initialLength - filteredLength;
        const totalLeft = initialLength - numberOfFilteredOut;
        ClientsManager.logManager.info(`loaded ${totalLoaded} numbers, excluded ${numberOfFilteredOut} of them, ${totalLeft} numbers total`);    
    }
    else
    {
        ClientsManager.logManager.info(`loaded ${totalLoaded} numbers`);
    }
    return fileNumbers;
}

// Example usage:

async function run() {
    const filePath: string[] = ['excel/data (1).xlsx'];
    const exclude: string[] = ['excel/data (1).xlsx'];
    const jsonData: any[] = await extractPhoneNumbers(filePath, exclude);
    console.log('Parsed Excel data:', jsonData);
}

export { extractPhoneNumbers, getFilesFromFolder };
