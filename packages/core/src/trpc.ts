import { isRecord } from './util';

const TRPC_PREFIX = '/api/trpc/';

export interface TrpcCall {
  procedure: string;
  input: unknown; // Request
  output: unknown; // Response
}

/**
 * Converts url to tRPC procedures. Discards add'l query arguments.
 * @param url
 * @returns Array of tRPC procedures or null if the URL is not a tRPC call
 */
export function parseProcedures(url: string): string[] | null {
  let pathname: string;

  try {
    // base only resolves relative URLs; localhost is a default placeholder
    pathname = new URL(url, 'http://localhost').pathname;
  } catch {
    return null;
  }

  if (!pathname.startsWith(TRPC_PREFIX)) return null;

  const list = decodeURIComponent(pathname.slice(TRPC_PREFIX.length));
  return list ? list.split(',') : null;
}

/**
 * Checks url for provided tRPC procedure
 * @param url
 * @param procedure
 * @returns True if URL includes procedure, false otherwise
 */
export function includesProcedure(url: string, procedure: string): boolean {
  return parseProcedures(url)?.includes(procedure) ?? false;
}

/**
 * Extracts JSON from SuperJSON format
 * @param value
 * @returns
 */
function unwrapSuperjson(value: unknown): unknown {
  return isRecord(value) && 'json' in value ? value.json : value;
}

/**
 * Split a (possibly batched) tRPC request/response pair into one entry per procedure.
 * Errored calls and unexpected shapes are skipped.
 */
export function unwrapBatch(url: string, requestBody: unknown, responseBody: unknown): TrpcCall[] {
  const procedures = parseProcedures(url);
  if (!procedures) return [];

  const isBatch = Array.isArray(responseBody);
  const responses: unknown[] = isBatch ? responseBody : [responseBody];
  const calls: TrpcCall[] = [];

  procedures.forEach((procedure, i) => {
    const response = responses[i];
    if (!isRecord(response) || !isRecord(response.result) || !('data' in response.result)) return;
    const rawInput = isBatch ? (isRecord(requestBody) ? requestBody[String(i)] : undefined) : requestBody;
    calls.push({
      procedure,
      input: unwrapSuperjson(rawInput),
      output: unwrapSuperjson(response.result.data)
    });
  });

  return calls;
}
