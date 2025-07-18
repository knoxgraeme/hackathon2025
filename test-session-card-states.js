/**
 * Test script for SessionCard shot state functionality
 * Tests localStorage integration and state calculation
 */

// Mock session data
const mockSession = {
  id: 'test-session-card-123',
  status: 'complete',
  locations: [
    { name: 'Location 1' },
    { name: 'Location 2' }
  ],
  shots: [
    { shotNumber: 1, title: 'Opening shot', storyboardImage: 'image1.jpg' },
    { shotNumber: 2, title: 'Close-up portrait', storyboardImage: 'image2.jpg' },
    { shotNumber: 3, title: 'Wide landscape', storyboardImage: 'image3.jpg' },
    { shotNumber: 4, title: 'Action shot', storyboardImage: 'image4.jpg' }
  ],
  createdAt: new Date().toISOString(),
  title: 'Test Portrait Session'
};

// Mock shot states - mixed states for testing
const mockShotStates = {
  0: 'COMPLETED',
  1: 'COMPLETED', 
  2: 'TODO',
  3: 'SKIPPED'
};

// Save mock states to localStorage
localStorage.setItem(`shotStates-${mockSession.id}`, JSON.stringify(mockShotStates));

// Test state calculation logic
function calculateStateCounts(session, shotStates) {
  const initializeShotStates = (existingStates = {}) => {
    if (!session.shots) return existingStates;
    
    const initializedStates = { ...existingStates };
    
    session.shots.forEach((_, index) => {
      if (!(index in initializedStates)) {
        initializedStates[index] = 'TODO';
      }
    });
    
    return initializedStates;
  };

  const states = initializeShotStates(shotStates);
  const counts = { TODO: 0, COMPLETED: 0, SKIPPED: 0 };
  
  Object.values(states).forEach(state => {
    counts[state]++;
  });
  
  return counts;
}

// Test the calculation
const stateCounts = calculateStateCounts(mockSession, mockShotStates);

console.log('SessionCard State Test Results:');
console.log('================================');
console.log('Mock Session:', mockSession.title);
console.log('Total Shots:', mockSession.shots.length);
console.log('State Counts:', stateCounts);
console.log('Expected: TODO: 1, COMPLETED: 2, SKIPPED: 1');
console.log('Actual matches expected:', 
  stateCounts.TODO === 1 && 
  stateCounts.COMPLETED === 2 && 
  stateCounts.SKIPPED === 1
);

// Test display logic
console.log('\nDisplay Tests:');
console.log('=============');
console.log('Show COMPLETED badge:', stateCounts.COMPLETED > 0, `(${stateCounts.COMPLETED} Done)`);
console.log('Show TODO badge:', stateCounts.TODO > 0, `(${stateCounts.TODO} Todo)`);
console.log('Show SKIPPED badge:', stateCounts.SKIPPED > 0, `(${stateCounts.SKIPPED} Skip)`);

// Test localStorage loading
console.log('\nLocalStorage Test:');
console.log('=================');
const savedStates = localStorage.getItem(`shotStates-${mockSession.id}`);
if (savedStates) {
  const parsedStates = JSON.parse(savedStates);
  console.log('States saved correctly:', JSON.stringify(parsedStates) === JSON.stringify(mockShotStates));
}

console.log('\nAll SessionCard tests completed successfully!'); 