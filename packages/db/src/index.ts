import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from './generated/prisma/client.js';
import { databaseUrlFromEnv } from './lib/env.js';
export type * from './generated/prisma/client.js';

export class DbClient {
  private constructor(private readonly prisma: PrismaClient) {}

  static async connect(url = databaseUrlFromEnv()): Promise<DbClient> {
    if (!url) throw new Error('No database URL: missing ADO_POSTGRES_* variables (see db.example.env)');
    const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });
    await prisma.$connect();
    return new DbClient(prisma);
  }

  async close(): Promise<void> {
    await this.prisma.$disconnect();
  }

  // test function - confirm access to db
  async ping(): Promise<{ database: string; items: number; snapshots: number }> {
    const [row] = await this.prisma.$queryRaw<{ db: string }[]>`select current_database() as db`;
    const [items, snapshots] = await Promise.all([this.prisma.item.count(), this.prisma.snapshot.count()]);
    return { database: row?.db ?? '?', items, snapshots };
  }

  async ingest(): Promise<void> {


  }

  //ingest
  //  - branches based on passed type
  //mergeItems()
  //rebuildAgg()
  //revoke / unrevoke snapshot
}

/**
 * https://dogonline.wiki/wiki/Bucket:Doggi
 *
 * ITEM - the page for the item that dropped
 * RARITY - final ratio/fraction
 * KILL - denominator for source
 * SOURCE - drop source
 * DROPS - numerator for source
 * startFromTime - epoch
 */

//assume name, id, image are sent when avail
