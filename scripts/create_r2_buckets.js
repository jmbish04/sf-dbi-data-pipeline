const { execSync } = require('child_process');

const buckets = [
  'sf-permits-data',
  'sf-permit-events',
  'sf-inspector-data',
  'sf-processed-files'
];

for (const bucket of buckets) {
  const cmd = `npx wrangler r2 bucket create ${bucket}`;
  console.log(`Running: ${cmd}`);
  try {
    execSync(cmd, { stdio: 'inherit' });
  } catch (err) {
    console.error(`Failed to create bucket ${bucket}:`, err.message);
  }
}
