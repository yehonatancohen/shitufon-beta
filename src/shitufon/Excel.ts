import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';
import { ClientsManager } from './ClientsManager';
import { get } from 'jquery';

function convertPhoneNumber(number: string) {
    // Implement phone number conversion logic here
    number = number.replace(/\W/g, '');
    let convertedNumbers;
    if (number.startsWith('0')) {
        convertedNumbers = '+972' + number.substring(1);
    } else if (number.startsWith('+972')) {
        convertedNumbers = number;
    } else if (number.startsWith('972')) {
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

function locatePositions(allFilesContent: any[]) {
    const headerRow = allFilesContent[0];
    const first_name_titles = ['firstname', 'first name', 'first-name', 'first_name', 'name'];
    const last_name_titles = ['lastname', 'last name', 'last-name', 'last_name'];
    const gender_titles = ['gender', 'מגדר'];
    const firstnameIndex = headerRow?.indexOf(first_name_titles.find(title => headerRow.includes(title)));
    const lastnameIndex = headerRow?.indexOf(last_name_titles.find(title => headerRow.includes(title)));
    const genderIndex = headerRow?.indexOf(gender_titles.find(title => headerRow.includes(title)));
    return { firstname: firstnameIndex, lastname: lastnameIndex, gender: genderIndex };
}

function processFile(allFilesContent: string[]): any[] {
    let allLines = new Set(); // Use a set to automatically remove duplicates
    const indexes = locatePositions(allFilesContent);

    // Iterate over each file's content
    allFilesContent.forEach(content => {
        const match = content.toString().match(/\b(?:\+?972[-\s]?)?(?:0?5[0-9]|5[0-9])[-\s]?[0-9]{3}[-\s]?[0-9]{4}/g);
        if (match && !allLines.has(match[0])) { // Avoid adding empty lines
            let full = { mobile: convertPhoneNumber(match[0]), name: content[indexes.firstname]?.split(' ', 0), fullname: content[indexes.firstname] + ' ' + content[indexes.lastname], gender: content[indexes.gender] };
            allLines.add(full);
        }
    });

    // Convert the set back into a string, joining with newlines
    const combinedContent: any[] = Array.from(allLines);
    return combinedContent;
}

function extractPhoneNumbers(filesContent: any, exclude: string): any[] {
    let allFilesContent: any[] = [];
    let excludeContent: any[] = [];
    allFilesContent = parseExcelFile(filesContent)
    let fileNumbers = processFile(allFilesContent);
    let totalLoaded = fileNumbers.length;
    let excludeNumbers: any[] = getWhitelistedNumbers(exclude);
    const initialLength = fileNumbers.length;
    let filteredLength = 0
    if (exclude.length > 0) {
        excludeNumbers = processFile(excludeContent);
        fileNumbers = fileNumbers.filter((el) => !excludeNumbers.includes(el));
        filteredLength += fileNumbers.length;
        const numberOfFilteredOut = initialLength - filteredLength;
        const totalLeft = initialLength - numberOfFilteredOut;
        ClientsManager.logManager.info(`loaded ${totalLoaded} numbers, excluded ${numberOfFilteredOut} of them, ${totalLeft} numbers total`);
    }
    else {
        ClientsManager.logManager.info(`loaded ${totalLoaded} numbers`);
    }
    return fileNumbers;
}

function getWhitelistedNumbers(filePath: string) {
    let whitelist: string[] = [];
    try {
        whitelist = fs.readFileSync(filePath, 'utf-8').split('\n').map(client => client.trim());
    } catch (error) {
        fs.writeFileSync(filePath, '', 'utf-8');
    }
    return whitelist;
}

export { extractPhoneNumbers };