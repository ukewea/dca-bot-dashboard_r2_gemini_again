import { useEffect, useState } from 'react';
import { fetchCurrentPositions } from '../lib/api';
import type { CurrentPositions } from '../types/data';
import { formatCurrency, formatDateTime, formatNumber } from '../lib/formatters';

export default function Dashboard() {
  const [data, setData] = useState<CurrentPositions | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCurrentPositions()
      .then(setData)
      .catch(err => setError(err.message));
  }, []);

  if (error) {
    return <div className="text-red-500">Error loading dashboard: {error}</div>;
  }

  if (!data) {
    return <div>Loading Dashboard...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Dashboard</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Last updated: {formatDateTime(data.updated_at)}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
          <h3 className="text-gray-500 dark:text-gray-400">Total Invested</h3>
          <p className="text-2xl font-semibold">
            {formatCurrency(data.total_quote_invested, data.base_currency)}
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-x-auto">
        <table className="w-full text-left">
          <thead className="border-b border-gray-200 dark:border-gray-700">
            <tr>
              <th className="p-4">Symbol</th>
              <th className="p-4 text-right">Quantity</th>
              <th className="p-4 text-right">Total Cost</th>
            </tr>
          </thead>
          <tbody>
            {data.positions.map(pos => (
              <tr key={pos.symbol} className="border-b border-gray-200 dark:border-gray-700 last:border-b-0">
                <td className="p-4 font-medium">{pos.symbol}</td>
                <td className="p-4 text-right">{formatNumber(pos.open_quantity || '0')}</td>
                <td className="p-4 text-right">{formatCurrency(pos.total_cost, data.base_currency)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}