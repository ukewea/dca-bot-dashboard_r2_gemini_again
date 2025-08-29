
import type { Decimal } from 'decimal.js';

// A unified interface for a single asset position.
// It includes all possible fields from both positions_current.json and snapshots.ndjson
export interface Position {
  symbol: string;
  open_quantity?: string; // From positions_current.json
  open_qty?: string;      // From snapshots.ndjson
  total_cost: string;
  avg_cost?: string;      // From snapshots.ndjson (and design doc)
  price?: string;         // From snapshots.ndjson
  market_value?: string;  // From snapshots.ndjson
  unrealized_pl?: string; // From snapshots.ndjson
}

// From public/data/positions_current.json
export interface CurrentPositions {
  updated_at: string;
  base_currency: string;
  total_quote_invested: string;
  positions: Position[];
}

// From public/data/snapshots.ndjson
export interface Snapshot {
  ts: string;
  base_currency: string;
  total_quote_invested: string;
  total_market_value: string;
  total_unrealized_pl: string;
  positions: Position[];
}

// From public/data/transactions.ndjson
export interface Transaction {
  ts: string;
  exchange: string;
  symbol: string;
  side: 'BUY' | 'SELL';
  price: string;
  qty: string;
  quote_spent: string;
  order_type: string;
  iteration_id: string;
  filters_validated: boolean;
  notes: string;
}

// From public/data/prices.ndjson
export interface Price {
  ts: string;
  symbol: string;
  price: string;
  source: string;
  iteration_id: string;
}
