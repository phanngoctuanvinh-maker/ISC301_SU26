require('./src/config/env');
const { startOtpCleanupJob } = require('./src/jobs/otp.cleanup.job');
const db = require('./src/config/db');
const { seed } = require('./src/scripts/seed');
const { migrateMvpSchema } = require('./src/scripts/migrate-mvp');
const { createApp } = require('./src/app');

const app = createApp();
const PORT = process.env.PORT || 8080;

app.listen(PORT, async () => {
  console.log(`Server is running at http://localhost:${PORT}`);
  await migrateMvpSchema();
  await checkAndSeed();
});

async function checkAndSeed() {
  try {
    const userCountRes = await db.query('SELECT COUNT(*) as count FROM users');
    const userCount = userCountRes[0].count;
    if (userCount <= 1) {
      console.log('[Auto-Seed] Database is empty or only has the default admin. Seeding sample data...');
      await seed();
    } else {
      console.log(`[Auto-Seed] Found ${userCount} users in DB. Skipping seed.`);
    }
  } catch (err) {
    console.error('[Auto-Seed Error]:', err.message);
  }
}

startOtpCleanupJob();

module.exports = app;
