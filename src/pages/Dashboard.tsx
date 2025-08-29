import { useEffect, useState, useMemo } from 'react';
import { fetchCurrentPositions, fetchSnapshots } from '../lib/api';
import type { CurrentPositions, Snapshot, Position } from '../types/data';
import { formatCurrency, formatDateTime, formatNumber } from '../lib/formatters';

// A component to render P/L with appropriate color
const PlValue = ({ value }: { value: number }) => {
  const color = value >= 0 ? 'text-green-500' : 'text-red-500';
  return <span className={color}>{formatCurrency(value)}</span>;
};

export default function Dashboard() {
  const [positions, setPositions] = useState<CurrentPositions | null>(null);
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetchCurrentPositions(),
      fetchSnapshots(),
    ]).then(([positionsData, snapshotsData]) => {
      setPositions(positionsData);
      setSnapshots(snapshotsData);
    }).catch(err => {
      setError(err.message);
    });
  }, []);

  const latestSnapshot = useMemo(() => {
    if (snapshots.length === 0) return null;
    // Snapshots are not guaranteed to be sorted, so we find the latest one
    return snapshots.reduce((latest, current) => 
      new Date(current.ts) > new Date(latest.ts) ? current : latest
    );
  }, [snapshots]);

  const enrichedPositions = useMemo(() => {
    if (!positions || !latestSnapshot) return [];

    const snapshotPositionsMap = new Map(latestSnapshot.positions.map(p => [p.symbol, p]));

    return positions.positions.map(pos => {
      const snapshotPos = snapshotPositionsMap.get(pos.symbol);
      const market_value = parseFloat(snapshotPos?.market_value || '0');
      const total_cost = parseFloat(pos.total_cost);
      const unrealized_pl = market_value - total_cost;

      return {
        ...pos,
        avg_cost: snapshotPos?.avg_cost || '0',
        price: snapshotPos?.price || '0',
        market_value: market_value.toString(),
        unrealized_pl: unrealized_pl.toString(),
      };
    });
  }, [positions, latestSnapshot]);

  if (error) {
    return <div className="text-red-500">Error loading dashboard: {error}</div>;
  }

  if (!positions || !latestSnapshot) {
    return <div>Loading Dashboard Data...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Dashboard</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Last updated: {formatDateTime(positions.updated_at)}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
          <h3 className="text-gray-500 dark:text-gray-400">Total Invested</h3>
          <p className="text-2xl font-semibold">
            {formatCurrency(positions.total_quote_invested, positions.base_currency)}
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
            {enrichedPositions.map(pos => (
              <tr key={pos.symbol} className="border-b border-gray-200 dark:border-gray-700 last:border-b-0">
                <td className="p-4 font-medium">{pos.symbol}</td>
                <td className="p-4 text-right">{formatNumber(pos.open_quantity || '0')}</td>
                <td className="p-4 text-right">{formatCurrency(pos.avg_cost, positions.base_currency)}</td>
                <td className="p-4 text-right">{formatCurrency(pos.price, positions.base_currency)}</td>
                <td className="p-4 text-right">{formatCurrency(pos.total_cost, positions.base_currency)}</td>
                <td className="p-4 text-right">{formatCurrency(pos.market_value, positions.base_currency)}</td>
                <td className="p-4 text-right"><PlValue value={parseFloat(pos.unrealized_pl)} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
