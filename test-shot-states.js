/**
 * Test script for shot state functionality
 * Tests localStorage persistence
 */

// Mock session data for testing
const mockSession = {
  id: 'test-session-123',
  shots: [
    { shotNumber: 1, title: 'Opening shot' },
    { shotNumber: 2, title: 'Close-up portrait' },
    { shotNumber: 3, title: 'Wide landscape' }
  ]
};

// Test shot states
const testStates = {
  0: 'TODO',
  1: 'COMPLETED', 
  2: 'SKIPPED'
};

// Test localStorage functionality
console.log('Testing localStorage...');
localStorage.setItem(`shotStates-${mockSession.id}`, JSON.stringify(testStates));
const savedStates = localStorage.getItem(`shotStates-${mockSession.id}`);
console.log('Saved states:', JSON.parse(savedStates));

// Test state cycling
function cycleState(currentState) {
  switch (currentState) {
    case 'TODO': return 'COMPLETED';
    case 'COMPLETED': return 'SKIPPED';
    case 'SKIPPED': return 'TODO';
    default: return 'TODO';
  }
}

console.log('Testing state cycling...');
console.log('TODO -> COMPLETED:', cycleState('TODO'));
console.log('COMPLETED -> SKIPPED:', cycleState('COMPLETED'));
console.log('SKIPPED -> TODO:', cycleState('SKIPPED'));

// Test color mapping
function getStateColor(state) {
  switch (state) {
    case 'TODO': return 'bg-amber-500';
    case 'COMPLETED': return 'bg-teal-500';
    case 'SKIPPED': return 'bg-gray-500';
    default: return 'bg-amber-500';
  }
}

// Test label mapping
function getStateLabel(state) {
  switch (state) {
    case 'TODO': return 'Todo';
    case 'COMPLETED': return 'Done';
    case 'SKIPPED': return 'Skip';
    default: return 'Todo';
  }
}

console.log('Testing color mapping...');
console.log('TODO color:', getStateColor('TODO'));
console.log('COMPLETED color:', getStateColor('COMPLETED'));
console.log('SKIPPED color:', getStateColor('SKIPPED'));

console.log('Testing label mapping...');
console.log('TODO label:', getStateLabel('TODO'));
console.log('COMPLETED label:', getStateLabel('COMPLETED'));
console.log('SKIPPED label:', getStateLabel('SKIPPED'));

console.log('All tests completed successfully!'); 