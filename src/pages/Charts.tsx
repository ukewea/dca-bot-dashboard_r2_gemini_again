import { useEffect, useState, useMemo } from 'react';
import { processTransactionData } from '../lib/processor';
import type { Snapshot } from '../types/data';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { formatCurrency, formatDateTime } from '../lib/formatters';

type TimeRange = '24h' | '7d' | '30d' | 'all';

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088FE', '#00C49F', '#FFBB28'];

export default function Charts() {
  const [history, setHistory] = useState<Snapshot[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRange>('all');
  const [selectedSymbols, setSelectedSymbols] = useState<string[]>([]);

  useEffect(() => {
    processTransactionData()
      .then(data => {
        setHistory(data.history);
      })
      .catch(err => {
        console.error(err);
        setError(err.message);
      });
  }, []);

  const allSymbols = useMemo(() => {
    const symbols = new Set<string>();
    history.forEach(s => {
      s.positions.forEach(p => symbols.add(p.symbol));
    });
    return Array.from(symbols);
  }, [history]);
  
  useEffect(() => {
    if (allSymbols.length > 0) {
      setSelectedSymbols(allSymbols);
    }
  }, [allSymbols]);

  const filteredData = useMemo(() => {
    let data = history;
    if (timeRange !== 'all') {
      const now = new Date();
      const days = timeRange === '24h' ? 1 : timeRange === '7d' ? 7 : 30;
      const cutoff = now.setDate(now.getDate() - days);
      data = history.filter(s => new Date(s.ts).getTime() > cutoff);
    }
    
    return data.map(s => {
        const processed: {[key: string]: any} = {
          ts: s.ts,
          total_market_value: parseFloat(s.total_market_value),
          total_quote_invested: parseFloat(s.total_quote_invested),
          total_unrealized_pl: parseFloat(s.total_unrealized_pl),
        };
        s.positions.forEach(p => {
            processed[p.symbol] = parseFloat(p.market_value || '0');
        });
        return processed;
    });

  }, [history, timeRange]);

  const handleSymbolToggle = (symbol: string) => {
    setSelectedSymbols(prev => 
      prev.includes(symbol) 
        ? prev.filter(s => s !== symbol)
        : [...prev, symbol]
    );
  };

  if (error) {
    return <div className="text-red-500">Error loading charts: {error}</div>;
  }

  if (history.length === 0) {
    return <div>Processing Chart Data...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Portfolio Charts</h2>
        <div className="flex space-x-1 bg-gray-200 dark:bg-gray-700 p-1 rounded-md">
          {(['24h', '7d', '30d', 'all'] as TimeRange[]).map(range => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1 text-sm rounded-md ${timeRange === range ? 'bg-white dark:bg-gray-800 shadow' : 'hover:bg-gray-100 dark:hover:bg-gray-600'}`}
            >
              {range.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {allSymbols.map(symbol => (
          <button
            key={symbol}
            onClick={() => handleSymbolToggle(symbol)}
            className={`px-3 py-1 text-sm rounded-full ${selectedSymbols.includes(symbol) ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}
          >
            {symbol}
          </button>
        ))}
      </div>

      <div className="h-96 bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={filteredData}>
            <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
            <XAxis dataKey="ts" tickFormatter={(ts) => new Date(ts).toLocaleDateString()} stroke="currentColor" />
            <YAxis yAxisId="left" tickFormatter={(value) => formatCurrency(value, history[0]?.base_currency)} stroke="currentColor" />
            <YAxis yAxisId="right" orientation="right" tickFormatter={(value) => formatCurrency(value, history[0]?.base_currency)} stroke="currentColor" />
            <Tooltip
              contentStyle={{ backgroundColor: 'rgba(31, 41, 55, 0.8)', borderColor: '#4b5563' }}
              labelFormatter={(label) => formatDateTime(label)}
              formatter={(value, name) => [formatCurrency(value as number, history[0]?.base_currency), name]}
            />
            <Legend />
            <Line yAxisId="left" type="monotone" dataKey="total_market_value" name="Market Value" stroke="#8884d8" dot={false} strokeWidth={2} />
            <Line yAxisId="left" type="monotone" dataKey="total_quote_invested" name="Total Invested" stroke="#82ca9d" dot={false} strokeWidth={2} />
            <Line yAxisId="right" type="monotone" dataKey="total_unrealized_pl" name="Unrealized P/L" stroke="#ffc658" dot={false} strokeWidth={2} />
            {selectedSymbols.map((symbol, index) => (
              <Line yAxisId="left" key={symbol} type="monotone" dataKey={symbol} name={symbol} stroke={COLORS[index % COLORS.length]} dot={false} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
