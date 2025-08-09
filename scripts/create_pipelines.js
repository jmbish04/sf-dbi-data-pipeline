const { execSync } = require('child_process');

const pipelines = [
  {
    name: 'sf-permits-ingestion',
    r2: 'sf-permits-data',
    seconds: 60,
    mb: 50,
    shards: 3,
  },
  {
    name: 'sf-permit-events',
    r2: 'sf-permit-events',
    seconds: 30,
    mb: 25,
    shards: 2,
  },
  {
    name: 'sf-inspector-analytics',
    r2: 'sf-inspector-data',
    seconds: 300,
    mb: 100,
    shards: 1,
  }
];

for (const p of pipelines) {
  const cmd = `npx -y wrangler pipelines create ${p.name} --r2-bucket ${p.r2} --batch-max-seconds ${p.seconds} --batch-max-mb ${p.mb} --compression gzip --shard-count ${p.shards}`;
  console.log(`Running: ${cmd}`);
  try {
    execSync(cmd, { stdio: 'inherit' });
  } catch (err) {
    console.error(`Failed to create pipeline ${p.name}:`, err.message);
    console.error('Full error details:', err);
  }
}
