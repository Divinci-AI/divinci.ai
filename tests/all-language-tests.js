/**
 * All Language Tests
 *
 * This file runs all the language-related tests.
 */

const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

async function runTests() {
  console.log('Running all language-related tests...');

  try {
    // Run the Spanish navigation test
    console.log('\n=== Running Spanish Navigation Test ===');
    await execAsync('npx playwright test tests/spanish-navigation.test.js');

    // Run the French navigation test
    console.log('\n=== Running French Navigation Test ===');
    await execAsync('npx playwright test tests/french-navigation.test.js');

    // Run the Arabic navigation test
    console.log('\n=== Running Arabic Navigation Test ===');
    await execAsync('npx playwright test tests/arabic-navigation.test.js');

    // Run the language switching test
    console.log('\n=== Running Language Switching Test ===');
    await execAsync('npx playwright test tests/language-switching.test.js');

    console.log('\n=== All language-related tests completed successfully! ===');
  } catch (error) {
    console.error('Error running tests:', error);
    process.exit(1);
  }
}

runTests();
