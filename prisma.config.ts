import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',

  migrations: {
    path: 'prisma/migrations'
  },

  datasource: {
    url:
      'postgresql://' +
      env('ADO_POSTGRES_USER') +
      ':' +
      env('ADO_POSTGRES_PWD') +
      '@' +
      env('ADO_POSTGRES_URL') +
      ':' +
      env('ADO_POSTGRES_PORT_OUT') +
      '/' +
      env('ADO_POSTGRES_DB')
  }
});
