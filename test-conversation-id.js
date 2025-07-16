// Test script to verify conversation ID capture
// Run this in the browser console when testing the ConversationFlow component

console.log('=== Conversation ID Debug Helper ===');
console.log('This script will help debug conversation ID issues.');
console.log('');
console.log('Steps to test:');
console.log('1. Open the application and navigate to a session page');
console.log('2. Open browser developer console');
console.log('3. Click "Start Planning Call"');
console.log('4. Watch the console logs for:');
console.log('   - "Got conversation ID from startSession: ..."');
console.log('   - "Conversation ID from getId(): ..."');
console.log('   - "Fallback conversation ID from getId(): ..."');
console.log('   - "Found conversation ID via periodic check: ..."');
console.log('5. End the call and check if conversation ID is passed to onComplete');
console.log('');
console.log('Expected behavior:');
console.log('- startSession() should return a conversation ID immediately');
console.log('- If not, getId() in onConnect should capture it');
console.log('- If still not available, the periodic check should find it');
console.log('- When disconnecting, the stored ID should be available');
console.log('');
console.log('Common issues:');
console.log('- If no ID is ever found, the ElevenLabs SDK might not be configured correctly');
console.log('- Check that the agent ID is valid');
console.log('- Ensure you have proper API credentials');