/**
 * Resolves the Postgres connection string from the `ADO_POSTGRES_*` variables in `db.env`.
 * Returns undefined if missing required variables, so callers decide whether that is fatal.
 */
export function databaseUrlFromEnv(env: NodeJS.ProcessEnv = process.env): string | undefined {
  const { ADO_POSTGRES_USER, ADO_POSTGRES_PWD, ADO_POSTGRES_URL, ADO_POSTGRES_PORT_OUT, ADO_POSTGRES_DB } = env;
  if (!ADO_POSTGRES_USER || !ADO_POSTGRES_PWD || !ADO_POSTGRES_URL || !ADO_POSTGRES_DB) return undefined;

  const port = ADO_POSTGRES_PORT_OUT || '5432';
  return `postgresql://${ADO_POSTGRES_USER}:${ADO_POSTGRES_PWD}@${ADO_POSTGRES_URL}:${port}/${ADO_POSTGRES_DB}`;
}
