import { DbClient } from '@ado/db';

// Scratch harness for exercising @ado/db against the dev database.
const db = await DbClient.connect();

try {
  console.log('connected:', await db.ping());
} finally {
  await db.close();
}
