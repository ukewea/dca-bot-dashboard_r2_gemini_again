import type { CurrentPositions, Snapshot, Transaction } from '../types/data';

// Construct the base path for data files respecting the deployment sub-path.
// import.meta.env.BASE_URL is provided by Vite and corresponds to the `base` config.
// We need to remove leading/trailing slashes to safely join parts.
const cleanBaseUrl = import.meta.env.BASE_URL.replace(/^\/|\/$/g, '');
const DATA_ROOT = cleanBaseUrl ? `/${cleanBaseUrl}/data` : '/data';


/**
 * Fetches and parses NDJSON (Newline Delimited JSON) text.
 * @param text The raw text content from the fetch response.
 * @returns An array of parsed JSON objects.
 */
function parseNdjson<T>(text: string): T[] {
  return text
    .split('\n')
    .filter(line => line.trim() !== '')
    .map(line => JSON.parse(line));
}

/**
 * Fetches the current positions data.
 */
export async function fetchCurrentPositions(): Promise<CurrentPositions> {
  const response = await fetch(`${DATA_ROOT}/positions_current.json`);
  if (!response.ok) {
    throw new Error('Failed to fetch current positions');
  }
  return response.json();
}

/**
 * Fetches the historical snapshot data.
 */
export async function fetchSnapshots(): Promise<Snapshot[]> {
  const response = await fetch(`${DATA_ROOT}/snapshots.ndjson`);
  if (!response.ok) {
    throw new Error('Failed to fetch snapshots');
  }
  const text = await response.text();
  return parseNdjson<Snapshot>(text);
}

/**
 * Fetches the transaction history data.
 */
export async function fetchTransactions(): Promise<Transaction[]> {
  const response = await fetch(`${DATA_ROOT}/transactions.ndjson`);
  if (!response.ok) {
    throw new Error('Failed to fetch transactions');
  }
  const text = await response.text();
  return parseNdjson<Transaction>(text);
}
