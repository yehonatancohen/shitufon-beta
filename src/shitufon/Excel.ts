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
function parseExcelFile(fileData: string): any[] {
    // Read the Excel file
    const workbook: XLSX.WorkBook = XLSX.read(fileData, { type: 'buffer' });

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
                    let full = {mobile: convertPhoneNumber(line), name: content[1], fullname: content[1] + ' ' + content[2], gender: content[5]};
                    allLines.add(full);
                });
            }
            else {
                let full = {mobile: convertPhoneNumber(match[0]), name: content[1], fullname: content[1] + ' ' + content[2], gender: content[5]};
                allLines.add(full);
            }
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

function extractPhoneNumbers(filesContent: any, exclude: string[], sessionIds: string[] = []): any[]{
    let allFilesContent : any[] = [];
    let excludeContent : any[] = [];
    exclude.push(...findSessionFiles(sessionIds));
    allFilesContent = parseExcelFile(filesContent)
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

export { extractPhoneNumbers, getFilesFromFolder };
