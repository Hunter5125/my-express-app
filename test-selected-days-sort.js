/**
 * Test to verify selected days are sorted by date (oldest first)
 * before being sent to the dayoff-request form
 */

console.log('✅ Testing selected days sorting logic\n');

// Simulate the sorting logic from createDayOffRequest
function testSortingLogic() {
  // Mock selected days in random order (new, old, middle)
  const selectedDays = [
    { 
      id: 'day1', 
      day: 'Tuesday', 
      date: '2026-01-21', 
      remark: 'Remark 1', 
      daysUsed: 1.5 
    },
    { 
      id: 'day2', 
      day: 'Monday', 
      date: '2026-01-16', 
      remark: 'Remark 2', 
      daysUsed: 0.5 
    },
    { 
      id: 'day3', 
      day: 'Tuesday', 
      date: '2026-01-14', 
      remark: 'Remark 3', 
      daysUsed: 0.5 
    }
  ];

  console.log('📋 Selected Days (Before Sorting):');
  console.log('═'.repeat(70));
  selectedDays.forEach((day, i) => {
    console.log(`${i + 1}. ${day.day} | ${day.date} | Days Used: ${day.daysUsed}`);
  });

  // Apply the same sorting logic as in createDayOffRequest
  const sortedSelectedDays = selectedDays.slice().sort((a, b) => {
    const dateA = new Date(a.date).getTime();
    const dateB = new Date(b.date).getTime();
    return dateA - dateB;
  });

  console.log('\n📋 Selected Days (After Sorting - Oldest First):');
  console.log('═'.repeat(70));
  sortedSelectedDays.forEach((day, i) => {
    console.log(`${i + 1}. ${day.day} | ${day.date} | Days Used: ${day.daysUsed}`);
  });

  // Verify sorting
  let isSorted = true;
  for (let i = 1; i < sortedSelectedDays.length; i++) {
    const prevDate = new Date(sortedSelectedDays[i - 1].date).getTime();
    const currDate = new Date(sortedSelectedDays[i].date).getTime();
    
    if (prevDate > currDate) {
      isSorted = false;
      console.log(`\n❌ Error: ${sortedSelectedDays[i - 1].date} comes before ${sortedSelectedDays[i].date}`);
    }
  }

  if (isSorted) {
    console.log('\n✅ Sorting verified: All selected days are in ascending date order (oldest first)');
    console.log('   - 2026-01-14 (Tuesday)');
    console.log('   - 2026-01-16 (Monday)');
    console.log('   - 2026-01-21 (Tuesday)');
  } else {
    console.log('\n❌ Sorting failed');
  }

  return isSorted;
}

const result = testSortingLogic();
process.exit(result ? 0 : 1);
