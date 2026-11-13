import { fileURLToPath } from 'node:url';
import { config } from 'dotenv';
import { defineConfig } from 'prisma/config';
import { databaseUrlFromEnv } from './src/lib/env.js';

// Pull from root db.env. Variables already in the environment (e.g. from compose) take precedence.
config({ path: fileURLToPath(new URL('../../db.env', import.meta.url)), quiet: true });

export default defineConfig({
  schema: 'prisma',
  migrations: {
    path: 'prisma/migrations'
  },
  datasource: {
    // Empty is fine for `prisma generate`; migrate/studio will report the missing URL.
    url: databaseUrlFromEnv() ?? ''
  }
});
