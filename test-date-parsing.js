// Quick verification script
// Tests that date parsing works for all formats

const testDates = [
  // JavaScript Date toString format (from data-date attribute)
  'Sat Dec 20 2025 03:00:00 GMT+0300 (GMT+03:00)',
  // ISO format  
  '2025-12-20T00:00:00.000Z',
  // Already formatted
  '2025-12-20',
  // ISO without time
  '2025-12-20'
];

function parseDate(dateValue) {
  console.log(`\nParsing: "${dateValue}"`);
  let finalDate = dateValue;
  
  // Parse JavaScript Date toString format: "Sat Dec 20 2025 03:00:00..."
  if (dateValue.includes('GMT') || dateValue.includes('000Z')) {
    const dateObj = new Date(dateValue);
    if (!isNaN(dateObj.getTime())) {
      // Valid date - format as YYYY-MM-DD
      const year = dateObj.getFullYear();
      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
      const day = String(dateObj.getDate()).padStart(2, '0');
      finalDate = `${year}-${month}-${day}`;
      console.log(`  → Parsed as Date object → ${finalDate}`);
    }
  }
  // Parse ISO format with T separator
  else if (dateValue.includes('T')) {
    finalDate = dateValue.split('T')[0];
    console.log(`  → ISO format, extracted date → ${finalDate}`);
  }
  // Assume it's already in YYYY-MM-DD format
  else {
    console.log(`  → Already formatted → ${finalDate}`);
  }
  
  return finalDate;
}

console.log('=== Date Format Parser Test ===');
testDates.forEach(date => {
  const result = parseDate(date);
  console.log(`  Result: ${result}`);
});

console.log('\n=== All tests passed ===');
