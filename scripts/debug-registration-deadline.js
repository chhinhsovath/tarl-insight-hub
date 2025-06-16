console.log('🔍 Registration Deadline Debugging Guide');

console.log('\n📋 Issues to Check:');
console.log('1. Form input value binding');
console.log('2. Form data processing before API call');
console.log('3. API request payload');
console.log('4. Database update execution');
console.log('5. API response handling');

console.log('\n🧪 Debug Steps:');
console.log('\n1️⃣ Test Form Input:');
console.log('   a. Go to: http://localhost:3001/training/sessions/11/edit');
console.log('   b. Open browser developer tools (Console tab)');
console.log('   c. Change the registration deadline field');
console.log('   d. Look for "Registration deadline changed:" log');

console.log('\n2️⃣ Test Form Submission:');
console.log('   a. Fill the registration deadline field');
console.log('   b. Click "Update Session"');
console.log('   c. Check console for these logs:');
console.log('      • "Submitting form data:" - check registration_deadline value');
console.log('      • "Submitting payload:" - check registration_deadline processing');
console.log('      • "Update result:" - check API response');

console.log('\n3️⃣ Test Server Logs:');
console.log('   a. Check server console for:');
console.log('      • "Received update data:" - verify registration_deadline reached API');
console.log('   b. Look for any database errors');

console.log('\n🎯 Expected Behavior:');
console.log('✅ Form input should accept date values');
console.log('✅ Console should show value changes');
console.log('✅ Payload should have correct registration_deadline');
console.log('✅ API should receive and process the value');
console.log('✅ Database should be updated');
console.log('✅ Response should include updated registration_deadline');

console.log('\n🔧 Common Issues & Solutions:');

console.log('\n📍 Issue: Empty string vs null');
console.log('   Problem: Empty date input sends "" instead of null');
console.log('   Solution: Form processing converts "" to null');
console.log('   Code: registration_deadline.trim() !== "" ? value : null');

console.log('\n📍 Issue: Date format problems');
console.log('   Problem: Database expects specific date format');
console.log('   Solution: HTML date input provides YYYY-MM-DD format');
console.log('   Status: ✅ Should work automatically');

console.log('\n📍 Issue: API parameter mismatch');
console.log('   Problem: Parameter position in SQL query is wrong');
console.log('   Solution: Verify parameter order in UPDATE query');
console.log('   Status: ✅ Position 9 is correct');

console.log('\n📍 Issue: Form not preventing navigation');
console.log('   Problem: Form redirects before saving');
console.log('   Solution: Check for successful API response');
console.log('   Status: ✅ Waits for result before redirect');

console.log('\n🔍 Manual Test:');
console.log('1. Set registration deadline to: 2024-12-25');
console.log('2. Save and check if it persists when you edit again');
console.log('3. Clear the field and save (should set to null)');
console.log('4. Verify both operations work correctly');

console.log('\n📝 If still not working:');
console.log('• Check browser Network tab for the PUT request');
console.log('• Verify request payload contains registration_deadline');
console.log('• Check response status and body');
console.log('• Look for any JavaScript errors during submission');

console.log('\n💡 Quick Fix Test:');
console.log('Try updating any other field (like session title) to verify');
console.log('the update mechanism works, then test registration deadline again.');