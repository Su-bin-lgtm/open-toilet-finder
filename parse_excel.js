const fs = require('fs');
const path = require('path');

// Read shared strings XML
const sharedStringsPath = path.join(__dirname, 'temp_extracted', 'xl', 'sharedStrings.xml');
const sharedStringsXml = fs.readFileSync(sharedStringsPath, 'utf-8');

// Parse shared strings - extract text from <si><t>...</t></si> or <si><r><t>...</t></r></si>
const strings = [];
const siRegex = /<si>([\s\S]*?)<\/si>/g;
let siMatch;

while ((siMatch = siRegex.exec(sharedStringsXml)) !== null) {
    let text = '';
    // Extract text from <t> tags
    const tRegex = /<t[^>]*>(.*?)<\/t>/g;
    let tMatch;
    while ((tMatch = tRegex.exec(siMatch[1])) !== null) {
        text += tMatch[1];
    }
    strings.push(text);
}

console.log(`Found ${strings.length} shared strings`);

// Read worksheet XML
const worksheetPath = path.join(__dirname, 'temp_extracted', 'xl', 'worksheets', 'sheet1.xml');
const worksheetXml = fs.readFileSync(worksheetPath, 'utf-8');

// Parse rows
const rowRegex = /<row[^>]*>([\s\S]*?)<\/row>/g;
let rowMatch;
let week4Found = false;
let inWeek4 = false;

console.log('\n=== Excel Data ===\n');

while ((rowMatch = rowRegex.exec(worksheetXml)) !== null) {
    const rowData = [];
    // Parse cells
    const cellRegex = /<c[^>]*>([\s\S]*?)<\/c>/g;
    let cellMatch;
    
    while ((cellMatch = cellRegex.exec(rowMatch[1])) !== null) {
        // Get cell value
        const valueMatch = cellMatch[1].match(/<v>(.*?)<\/v>/);
        let value = '';
        
        if (valueMatch) {
            const v = valueMatch[1];
            // Check if it's a shared string reference
            const attrMatch = cellMatch[0].match(/t="([^"]*)"/);
            if (attrMatch && attrMatch[1] === 's') {
                value = strings[parseInt(v)] || '';
            } else {
                value = v;
            }
        }
        rowData.push(value);
    }
    
    if (rowData.length > 0) {
        // Check for week headers
        const targetPeriod = rowData[5] || ''; // Column F (index 5) is 목표 시기
        const taskItem = rowData[3] || ''; // Column D (index 3) is 작업 항목
        
        if (targetPeriod.includes('4 주차')) {
            week4Found = true;
            inWeek4 = true;
            console.log('\n*** 4 주차 시작 ***\n');
        }
        
        if (inWeek4 && targetPeriod.includes('주차') && !targetPeriod.includes('4 주차')) {
            inWeek4 = false;
            console.log('\n*** 4 주차 종료 ***\n');
        }
        
        // Print row if in week 4 section
        if (inWeek4) {
            console.log(rowData.join('\t'));
        }
    }
}

if (!week4Found) {
    console.log('4 주차 not found. Let me check all weeks...');
    
    // Reset and find all week headers
    rowMatch = null;
    while ((rowMatch = rowRegex.exec(worksheetXml)) !== null) {
        const rowData = [];
        const cellRegex = /<c[^>]*>([\s\S]*?)<\/c>/g;
        let cellMatch;
        
        while ((cellMatch = cellRegex.exec(rowMatch[1])) !== null) {
            const valueMatch = cellMatch[1].match(/<v>(.*?)<\/v>/);
            let value = '';
            
            if (valueMatch) {
                const v = valueMatch[1];
                const attrMatch = cellMatch[0].match(/t="([^"]*)"/);
                if (attrMatch && attrMatch[1] === 's') {
                    value = strings[parseInt(v)] || '';
                } else {
                    value = v;
                }
            }
            rowData.push(value);
        }
        
        if (rowData.length > 5 && rowData[5] && rowData[5].includes('주차')) {
            console.log(`Found: ${rowData[5]} - ${rowData[3] || ''}`);
        }
    }
}
