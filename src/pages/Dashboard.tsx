import { LineChart } from '@mui/x-charts/LineChart';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { ScraperService } from '../services/ScraperService';

function Dashboard() {
    const [lastScrapeTime, setLastScrapeTime] = useState<Date | null>(null);
    const [nextScrapeIn, setNextScrapeIn] = useState<string>('');

    useEffect(() => {
        const updateTimer = () => {
            const lastScrape = ScraperService.getLastScrapeTime();
            setLastScrapeTime(lastScrape);

            if (lastScrape) {
                const now = new Date();
                const nextScrape = new Date(lastScrape.getTime() + 60 * 60 * 1000);
                const diff = nextScrape.getTime() - now.getTime();

                if (diff <= 0) {
                    setNextScrapeIn('Scraping now...');
                } else {
                    const hours = Math.floor(diff / (1000 * 60 * 60));
                    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
                    setNextScrapeIn(`${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
                }
            } else {
                setNextScrapeIn('Starting soon...');
            }
        };

        updateTimer();
        const interval = setInterval(updateTimer, 1000);

        return () => clearInterval(interval);
    }, []);

    const logs = [
        {
            id: '1',
            timestamp: '2025-03-10 12:00',
            action: 'Property Created',
            details: {
                address: '123 Main St',
                rms: 3,
                price: '$350,000',
                features: ['Pool', 'Hot Tub'],
                agent: 'John Kennedy'
            }
        },
        {
            id: '2',
            timestamp: '2025-03-12 15:30',
            action: 'Property Updated',
            details: {
                price: '$350,000 → $300,000',
                agent: 'John Kennedy → John Doe',
                features: 'Pool, Hot Tub → Pool, Garage'
            }
        },
        {
            id: '3',
            timestamp: '2025-03-18 14:30',
            action: 'Property Updated',
            details: {
                price: '$300,000 → $350,000',
                rms: '3 → 4'
            }
        },
    ];

    return (
        <div className="p-6 min-h-screen">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="shadow-md bg-white dark:bg-gray-900 rounded p-6 flex flex-col items-center justify-center">
                    <h2 className="text-6xl font-bold text-gray-800 dark:text-gray-300">{nextScrapeIn}</h2>
                    <p className="text-2xl text-gray-600 dark:text-gray-300 mt-2">until next scrape</p>
                    {lastScrapeTime && (
                        <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                            Last scrape: {lastScrapeTime.toLocaleString()}
                        </p>
                    )}
                </div>
                <div className="shadow-md bg-white dark:bg-gray-900 dark:text-gray-300 rounded p-6">
                    <LineChart
                        className="bg-white"
                        xAxis={[{ data: [1, 2, 3, 5, 8, 10, 11] }]}
                        series={[
                            {
                                data: [2, 5.5, 2, 8.5, 1.5, 5, 1],
                                color: 'blue',
                            },
                        ]}
                        width={550}
                        height={300}
                    />
                </div>
            </div>
            <div className="shadow-md bg-white dark:bg-gray-900 rounded p-6 mt-6">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-300">Activity Log</h3>
                    <Link
                        className="text-blue-600 font-semibold hover:text-blue-700"
                        to={"/properties"}
                    >
                        Go to Properties
                    </Link>
                </div>
                <ul className="space-y-4 max-h-58 overflow-y-auto">
                    {logs.map(log => (
                        <li key={log.id} className="p-4 bg-gray-50 dark:bg-gray-800 rounded shadow-sm cursor-pointer">
                            <div className="font-medium text-gray-700 dark:text-gray-300">
                                {log.timestamp} - <span className="text-blue-600">{log.action}</span>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}

export default Dashboard;
