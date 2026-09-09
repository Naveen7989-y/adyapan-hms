import EmbeddedPostgres from 'embedded-postgres';
import path from 'path';
import fs from 'fs';

const databaseDir = path.resolve(process.cwd(), '.pgdata');

export const pg = new EmbeddedPostgres({
  port: parseInt(process.env.PG_PORT || '5433', 10),
  databaseDir,
  user: process.env.PG_USER || 'postgres',
  password: process.env.PG_PASSWORD || 'password',
  database: process.env.PG_DATABASE || 'adyapan_hms',
});

export async function ensurePostgresRunning() {
  try {
    if (!fs.existsSync(databaseDir)) {
      console.log('Initializing new PostgreSQL cluster in', databaseDir);
      await pg.initialise();
    }
    await pg.start();
    console.log(`✓ PostgreSQL cluster active on port ${pg.port}`);
  } catch (err) {
    // If already running, that's fine
    if (err.message && err.message.includes('already running')) {
      console.log(`✓ PostgreSQL already running on port ${pg.port}`);
      return;
    }
    console.log('Postgres startup status:', err.message);
  }
}

if (process.argv[2] === 'start') {
  ensurePostgresRunning();
} else if (process.argv[2] === 'stop') {
  pg.stop().then(() => console.log('PostgreSQL stopped.'));
}
