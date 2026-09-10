import { callSelfTest } from './helpers/selftest-api.mjs';

try {
  const result = await callSelfTest('cleanup');
  if (result.warnings?.length) console.log(`Cleanup completed with ${result.warnings.length} warning(s).`);
  console.log('Automated test data cleanup complete.');
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
