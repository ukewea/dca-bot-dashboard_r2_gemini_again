import { useEffect, useState } from 'react';
import { processTransactionData } from '../lib/processor';
import type { Snapshot } from '../types/data';
import { formatCurrency, formatDateTime, formatNumber } from '../lib/formatters';

// A component to render P/L with appropriate color
const PlValue = ({ value }: { value: number }) => {
  const color = value >= 0 ? 'text-green-500' : 'text-red-500';
  const sign = value >= 0 ? '+' : '';
  return <span className={color}>{sign}{formatCurrency(value)}</span>;
};

export default function Dashboard() {
  const [latestSnapshot, setLatestSnapshot] = useState<Snapshot | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    processTransactionData()
      .then(data => {
        setLatestSnapshot(data.latest);
      })
      .catch(err => {
        console.error(err);
        setError(err.message);
      });
  }, []);

  if (error) {
    return <div className="text-red-500">Error loading dashboard: {error}</div>;
  }

  if (!latestSnapshot) {
    return <div>Processing Transaction Data...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Dashboard</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Last updated: {formatDateTime(latestSnapshot.ts)}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
          <h3 className="text-gray-500 dark:text-gray-400">Total Invested</h3>
          <p className="text-2xl font-semibold">
            {formatCurrency(latestSnapshot.total_quote_invested, latestSnapshot.base_currency)}
          </p>
        </div>
        <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
          <h3 className="text-gray-500 dark:text-gray-400">Market Value</h3>
          <p className="text-2xl font-semibold">
            {formatCurrency(latestSnapshot.total_market_value, latestSnapshot.base_currency)}
          </p>
        </div>
        <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
          <h3 className="text-gray-500 dark:text-gray-400">Total Unrealized P/L</h3>
          <p className="text-2xl font-semibold">
            <PlValue value={parseFloat(latestSnapshot.total_unrealized_pl)} />
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-x-auto">
        <table className="w-full text-left">
          <thead className="border-b border-gray-200 dark:border-gray-700">
            <tr>
              <th className="p-4">Asset</th>
              <th className="p-4 text-right">Quantity</th>
              <th className="p-4 text-right">Avg Cost</th>
              <th className="p-4 text-right">Last Price</th>
              <th className="p-4 text-right">Total Cost</th>
              <th className="p-4 text-right">Market Value</th>
              <th className="p-4 text-right">P/L (unrealized)</th>
            </tr>
          </thead>
          <tbody>
            {latestSnapshot.positions.map(pos => (
              <tr key={pos.symbol} className="border-b border-gray-200 dark:border-gray-700 last:border-b-0">
                <td className="p-4 font-medium">{pos.symbol}</td>
                <td className="p-4 text-right">{formatNumber(pos.open_quantity || pos.open_qty || '0')}</td>
                <td className="p-4 text-right">{formatCurrency(pos.avg_cost || '0', latestSnapshot.base_currency)}</td>
                <td className="p-4 text-right">{formatCurrency(pos.price || '0', latestSnapshot.base_currency)}</td>
                <td className="p-4 text-right">{formatCurrency(pos.total_cost, latestSnapshot.base_currency)}</td>
                <td className="p-4 text-right">{formatCurrency(pos.market_value || '0', latestSnapshot.base_currency)}</td>
                <td className="p-4 text-right"><PlValue value={parseFloat(pos.unrealized_pl || '0')} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

