import Decimal from 'decimal.js';
import { fetchTransactions, fetchPrices } from './api';
import type { Transaction, Price, Snapshot, Position } from '../types/data';

// Set precision for decimal calculations
Decimal.set({ precision: 30 });

export interface ProcessedData {
  latest: Snapshot;
  history: Snapshot[];
}

// Main function to process transactions and prices
export async function processTransactionData(): Promise<ProcessedData> {
  const [transactions, prices] = await Promise.all([
    fetchTransactions(),
    fetchPrices(),
  ]);

  if (transactions.length === 0) {
    // Handle case with no transactions gracefully
    const emptySnapshot: Snapshot = {
      ts: new Date().toISOString(),
      base_currency: 'USDC', // Default or derive from somewhere else if possible
      total_quote_invested: '0',
      total_market_value: '0',
      total_unrealized_pl: '0',
      positions: [],
    };
    return { latest: emptySnapshot, history: [] };
  }

  // Create a map for quick lookup of latest prices
  const latestPrices = new Map<string, Decimal>();
  for (const price of prices) {
    latestPrices.set(price.symbol, new Decimal(price.price));
  }

  const portfolioHistory: Snapshot[] = [];
  const positions = new Map<string, { quantity: Decimal; cost: Decimal }>();
  let totalInvested = new Decimal(0);
  
  // Sort transactions by timestamp ascending
  const sortedTransactions = transactions.sort((a, b) => new Date(a.ts).getTime() - new Date(b.ts).getTime());

  for (const tx of sortedTransactions) {
    // Update portfolio state
    const position = positions.get(tx.symbol) || { quantity: new Decimal(0), cost: new Decimal(0) };
    position.quantity = position.quantity.plus(tx.qty);
    position.cost = position.cost.plus(tx.quote_spent);
    positions.set(tx.symbol, position);

    totalInvested = totalInvested.plus(tx.quote_spent);

    // Create a snapshot at this point in time
    let totalMarketValue = new Decimal(0);
    const snapshotPositions: Position[] = [];

    for (const [symbol, pos] of positions.entries()) {
      const latestPrice = latestPrices.get(symbol) || new Decimal(0);
      const marketValue = pos.quantity.times(latestPrice);
      const unrealizedPl = marketValue.minus(pos.cost);
      
      totalMarketValue = totalMarketValue.plus(marketValue);

      snapshotPositions.push({
        symbol: symbol,
        open_qty: pos.quantity.toString(),
        open_quantity: pos.quantity.toString(),
        total_cost: pos.cost.toString(),
        avg_cost: pos.cost.dividedBy(pos.quantity).toString(),
        price: latestPrice.toString(),
        market_value: marketValue.toString(),
        unrealized_pl: unrealizedPl.toString(),
      });
    }

    const totalUnrealizedPl = totalMarketValue.minus(totalInvested);

    portfolioHistory.push({
      ts: tx.ts,
      base_currency: 'USDC', // Assuming USDC from context
      total_quote_invested: totalInvested.toString(),
      total_market_value: totalMarketValue.toString(),
      total_unrealized_pl: totalUnrealizedPl.toString(),
      positions: snapshotPositions,
    });
  }

  const latest = portfolioHistory.length > 0 ? portfolioHistory[portfolioHistory.length - 1] : {
      ts: new Date().toISOString(),
      base_currency: 'USDC',
      total_quote_invested: '0',
      total_market_value: '0',
      total_unrealized_pl: '0',
      positions: [],
  };

  return { latest, history: portfolioHistory };
}
