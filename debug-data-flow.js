// Test script to verify data attributes in table row
const fs = require('fs');
const path = require('path');

// Read the requests.hbs file
const requestsHbsPath = path.join(__dirname, 'views', 'requests.hbs');
const content = fs.readFileSync(requestsHbsPath, 'utf8');

// Find the line with data-day-to-be-taken
const lines = content.split('\n');
const relevantLines = lines.filter((line, idx) => {
  return line.includes('data-day-to-be-taken') || line.includes('data-date-to-be-taken') || (idx > 18 && idx < 32);
});

console.log('=== Data Attributes in requests.hbs Table Row ===\n');
relevantLines.forEach((line, idx) => {
  console.log(`Line ${idx}: ${line.substring(0, 150)}${line.length > 150 ? '...' : ''}`);
});

// Also check what DayOffRequest fields are available
const DayOffRequestPath = path.join(__dirname, 'models', 'DayOffRequest.js');
const modelContent = fs.readFileSync(DayOffRequestPath, 'utf8');
const fields = modelContent.match(/(\w+):\s*{[\s\S]*?(?:type:|required:)/g) || [];

console.log('\n=== DayOffRequest Model Fields ===\n');
const relevantFields = ['day_to_be_taken', 'date_to_be_taken', 'working_day', 'working_day_date', 'day', 'date'];
relevantFields.forEach(field => {
  if (modelContent.includes(field)) {
    console.log(`✅ ${field} - FOUND in model`);
  } else {
    console.log(`❌ ${field} - NOT FOUND in model`);
  }
});
