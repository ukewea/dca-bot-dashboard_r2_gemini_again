import { useEffect, useState, useMemo } from 'react';
import { fetchTransactions } from '../lib/api';
import type { Transaction } from '../types/data';
import { formatCurrency, formatDateTime, formatNumber } from '../lib/formatters';

export default function Transactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [symbolFilter, setSymbolFilter] = useState<string>('all');

  useEffect(() => {
    fetchTransactions()
      .then(data => setTransactions(data.sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime()))) // Sort by most recent first
      .catch(err => setError(err.message));
  }, []);

  const allSymbols = useMemo(() => {
    const symbols = new Set<string>();
    transactions.forEach(t => symbols.add(t.symbol));
    return ['all', ...Array.from(symbols)];
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    if (symbolFilter === 'all') {
      return transactions;
    }
    return transactions.filter(t => t.symbol === symbolFilter);
  }, [transactions, symbolFilter]);

  if (error) {
    return <div className="text-red-500">Error loading transactions: {error}</div>;
  }

  if (transactions.length === 0) {
    return <div>Loading Transactions...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Transactions</h2>
        {/* Symbol Filter */}
        <select
          value={symbolFilter}
          onChange={e => setSymbolFilter(e.target.value)}
          className="p-2 rounded-md bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600"
        >
          {allSymbols.map(symbol => (
            <option key={symbol} value={symbol}>
              {symbol.toUpperCase()}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-x-auto">
        <table className="w-full text-left">
          <thead className="border-b border-gray-200 dark:border-gray-700">
            <tr>
              <th className="p-4">Date</th>
              <th className="p-4">Symbol</th>
              <th className="p-4">Side</th>
              <th className="p-4 text-right">Quantity</th>
              <th className="p-4 text-right">Price</th>
              <th className="p-4 text-right">Total Spent</th>
            </tr>
          </thead>
          <tbody>
            {filteredTransactions.map(tx => (
              <tr key={tx.ts + tx.symbol} className="border-b border-gray-200 dark:border-gray-700 last:border-b-0">
                <td className="p-4 text-sm text-gray-500 dark:text-gray-400">{formatDateTime(tx.ts)}</td>
                <td className="p-4 font-medium">{tx.symbol}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    tx.side === 'BUY' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800'
                  }`}>
                    {tx.side}
                  </span>
                </td>
                <td className="p-4 text-right">{formatNumber(tx.qty)}</td>
                <td className="p-4 text-right">{formatCurrency(tx.price)}</td>
                <td className="p-4 text-right">{formatCurrency(tx.quote_spent)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}