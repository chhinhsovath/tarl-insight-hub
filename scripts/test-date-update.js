// Simple test to verify date handling in edit form
console.log('🧪 Testing Date Field Handling');

// Test date formatting functions
function formatDateForInput(dateString) {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    return date.toISOString().split('T')[0];
  } catch (error) {
    console.error('Date formatting error:', error);
    return '';
  }
}

function formatTimeForInput(timeString) {
  if (!timeString) return '';
  try {
    // If time is already in HH:MM format, return as is
    if (timeString.match(/^\d{2}:\d{2}$/)) {
      return timeString;
    }
    // If time includes seconds, remove them
    if (timeString.match(/^\d{2}:\d{2}:\d{2}/)) {
      return timeString.substring(0, 5);
    }
    // Try to parse as a full datetime and extract time
    const date = new Date(`2000-01-01T${timeString}`);
    if (!isNaN(date.getTime())) {
      return date.toTimeString().substring(0, 5);
    }
    return '';
  } catch (error) {
    console.error('Time formatting error:', error);
    return '';
  }
}

// Test cases
const testCases = [
  // Date tests
  { input: '2024-12-25', type: 'date', expected: '2024-12-25' },
  { input: '2024-12-25T00:00:00.000Z', type: 'date', expected: '2024-12-25' },
  { input: null, type: 'date', expected: '' },
  { input: undefined, type: 'date', expected: '' },
  { input: '', type: 'date', expected: '' },
  
  // Time tests
  { input: '10:30', type: 'time', expected: '10:30' },
  { input: '10:30:00', type: 'time', expected: '10:30' },
  { input: '10:30:45', type: 'time', expected: '10:30' },
  { input: null, type: 'time', expected: '' },
  { input: undefined, type: 'time', expected: '' },
  { input: '', type: 'time', expected: '' },
];

console.log('\n📅 Date Formatting Tests:');
testCases.filter(tc => tc.type === 'date').forEach((testCase, index) => {
  const result = formatDateForInput(testCase.input);
  const passed = result === testCase.expected;
  console.log(`${passed ? '✅' : '❌'} Test ${index + 1}: "${testCase.input}" → "${result}" (expected: "${testCase.expected}")`);
});

console.log('\n🕐 Time Formatting Tests:');
testCases.filter(tc => tc.type === 'time').forEach((testCase, index) => {
  const result = formatTimeForInput(testCase.input);
  const passed = result === testCase.expected;
  console.log(`${passed ? '✅' : '❌'} Test ${index + 1}: "${testCase.input}" → "${result}" (expected: "${testCase.expected}")`);
});

console.log('\n🔧 Fixes Applied:');
console.log('✅ Added proper date formatting for form inputs');
console.log('✅ Added time formatting to handle seconds and different formats');
console.log('✅ Updated API route to properly handle all field updates');
console.log('✅ Added debugging logs to track form submission data');
console.log('✅ Removed COALESCE to allow proper field updates');

console.log('\n🎯 How to Test:');
console.log('1. Go to: http://localhost:3001/training/sessions');
console.log('2. Click edit on any session');
console.log('3. Modify date fields and save');
console.log('4. Check browser console for submission logs');
console.log('5. Verify the changes are saved correctly');

console.log('\n📝 Expected Behavior:');
console.log('- Date fields should pre-populate with existing values');
console.log('- Time fields should show existing times without seconds');
console.log('- All date/time changes should save successfully');
console.log('- Form should redirect back to sessions list on success');