console.log('🧪 Testing DELETE API Endpoint');

console.log('\n📋 Manual API Test:');
console.log('1. Open browser developer tools (Network tab)');
console.log('2. Go to: http://localhost:3000/training/sessions/7/edit');
console.log('3. Click the "Delete Session" button');
console.log('4. Click "Delete Session" in the dialog');
console.log('5. Check Network tab for the DELETE request');

console.log('\n🔍 What to Look For in Network Tab:');
console.log('• Request URL: /api/training/sessions?id=7');
console.log('• Request Method: DELETE');
console.log('• Response Status: Should be 200, currently getting 500');
console.log('• Response Body: Check for detailed error message');

console.log('\n🚨 Common 500 Error Causes:');
console.log('1. Missing database tables');
console.log('2. Database connection issues');
console.log('3. Invalid SQL queries');
console.log('4. Missing table columns');
console.log('5. Permission/authentication issues');

console.log('\n🔧 Quick Debug Steps:');
console.log('1. Check server console for detailed error logs');
console.log('2. Verify session ID 7 exists in database');
console.log('3. Test with a different session ID');
console.log('4. Check if tables exist: tbl_tarl_training_sessions, etc.');

console.log('\n⚡ Alternative Test:');
console.log('Try testing delete from the main sessions page:');
console.log('• Go to: http://localhost:3000/training/sessions');
console.log('• Click delete button on any session');
console.log('• See if the error occurs there too');

console.log('\n🎯 Expected API Response:');
console.log('{');
console.log('  "success": true,');
console.log('  "message": "Training session deleted successfully"');
console.log('}');

console.log('\n❌ Current Error Response:');
console.log('{');
console.log('  "error": "Internal server error"');
console.log('}');

console.log('\n💡 Server Console Debug:');
console.log('The server should log the actual error causing the 500.');
console.log('Look for messages starting with "Error deleting training session:"');
console.log('This will show the root cause of the database/API failure.');