import React, { useState, useEffect } from 'react';
import { FaPlay, FaSpinner, FaBuilding, FaSyncAlt, FaExternalLinkAlt } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

interface DaftAgency {
  id: number;
  daft_id: string;
  name: string;
  phone: string;
  email: string;
  website: string;
  logo_url: string;
  total_properties?: number;
  last_scraped_at: string;
}

interface Stats {
  totalProperties: number;
  totalAgencies: number;
  lastSync: string;
}

interface SyncLog {
  id: number;
  scrape_type: string;
  properties_scraped: number;
  properties_added: number;
  properties_updated: number;
  agencies_scraped: number;
  duration_seconds: number;
  completed_at: string;
}

const DaftData: React.FC = () => {
  const navigate = useNavigate();
  const [agencies, setAgencies] = useState<DaftAgency[]>([]);
  const [stats, setStats] = useState<Stats>({ totalProperties: 0, totalAgencies: 0, lastSync: '' });
  const [scrapeLogs, setScrapeLogs] = useState<SyncLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [syncMode, setSyncMode] = useState<'full' | 'incremental'>('full');
  const [syncLogs, setSyncLogs] = useState<string[]>([]);

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  useEffect(() => {
    loadData();
    loadScrapeLogs();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [agenciesRes, propertiesRes, lastSyncRes] = await Promise.all([
        fetch(`${supabaseUrl}/rest/v1/daft_agencies?select=*&order=name.asc`, {
          headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
        }),
        fetch(`${supabaseUrl}/rest/v1/daft_properties?select=agency_id`, {
          headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
        }),
        fetch(`${supabaseUrl}/rest/v1/daft_scrape_log?select=completed_at&order=completed_at.desc&limit=1`, {
          headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
        }),
      ]);

      if (agenciesRes.ok && propertiesRes.ok) {
        const agenciesData: DaftAgency[] = await agenciesRes.json();
        const propertiesData = await propertiesRes.json();

        const propertyCounts = propertiesData.reduce((acc: any, prop: any) => {
          acc[prop.agency_id] = (acc[prop.agency_id] || 0) + 1;
          return acc;
        }, {});

        const agenciesWithCounts = agenciesData.map(agency => ({
          ...agency,
          total_properties: propertyCounts[agency.id] || 0,
        }));

        setAgencies(agenciesWithCounts);

        const lastSyncData = await lastSyncRes.json();
        setStats({
          totalProperties: propertiesData.length,
          totalAgencies: agenciesData.length,
          lastSync: lastSyncData[0]?.completed_at || '',
        });
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadScrapeLogs = async () => {
    try {
      const response = await fetch(
        `${supabaseUrl}/rest/v1/daft_scrape_log?select=*&order=completed_at.desc&limit=10`,
        {
          headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setScrapeLogs(data);
      }
    } catch (error) {
      console.error('Error loading logs:', error);
    }
  };

  const startFullSync = async () => {
    if (!confirm('Start FULL SYNC? This will sync ALL locations and may take 30-60 minutes.')) {
      return;
    }

    setSyncing(true);
    setSyncLogs([]);

    const eventSource = new EventSource(
      `${supabaseUrl}/functions/v1/daft-full-scraper?mode=full&maxPages=10&stream=true`
    );

    eventSource.onmessage = (event) => {
      const log = event.data;
      setSyncLogs(prev => [...prev, log]);
    };

    eventSource.onerror = () => {
      eventSource.close();
      setSyncing(false);
      setSyncLogs(prev => [...prev, '✓ Sync completed!']);
      loadData();
      loadScrapeLogs();
    };
  };

  const startIncrementalSync = async () => {
    setSyncing(true);
    setSyncLogs([]);

    const eventSource = new EventSource(
      `${supabaseUrl}/functions/v1/daft-full-scraper?mode=incremental&maxPages=2&stream=true`
    );

    eventSource.onmessage = (event) => {
      const log = event.data;
      setSyncLogs(prev => [...prev, log]);
    };

    eventSource.onerror = () => {
      eventSource.close();
      setSyncing(false);
      setSyncLogs(prev => [...prev, '✓ Incremental sync completed!']);
      loadData();
      loadScrapeLogs();
    };
  };

  const handleAgencyClick = (agency: DaftAgency) => {
    navigate(`/daft-agencies/${agency.id}`);
  };

  const filteredAgencies = agencies.filter(agency =>
    agency.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex-1 p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">Daft.ie Estate Agents</h1>
          <p className="text-gray-600 dark:text-gray-400">Browse estate agents and their property listings from Daft.ie</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Properties</p>
                <p className="text-3xl font-bold text-gray-800 dark:text-white">{stats.totalProperties.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <FaBuilding className="text-2xl text-blue-600 dark:text-blue-300" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Agencies</p>
                <p className="text-3xl font-bold text-gray-800 dark:text-white">{stats.totalAgencies}</p>
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
                <FaSyncAlt className="text-2xl text-green-600 dark:text-green-300" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Last Sync</p>
                <p className="text-lg font-semibold text-gray-800 dark:text-white">
                  {stats.lastSync ? new Date(stats.lastSync).toLocaleDateString() : 'Never'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500">
                  {stats.lastSync ? new Date(stats.lastSync).toLocaleTimeString() : ''}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-6 p-6">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Sync Controls</h2>

          <div className="flex gap-6 mb-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="syncMode"
                value="full"
                checked={syncMode === 'full'}
                onChange={(e) => setSyncMode(e.target.value as 'full' | 'incremental')}
                className="w-4 h-4 text-blue-600"
              />
              <span className="text-gray-700 dark:text-gray-300">Full Sync (All locations)</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="syncMode"
                value="incremental"
                checked={syncMode === 'incremental'}
                onChange={(e) => setSyncMode(e.target.value as 'full' | 'incremental')}
                className="w-4 h-4 text-blue-600"
              />
              <span className="text-gray-700 dark:text-gray-300">Incremental Sync (Recent only)</span>
            </label>
          </div>

          <button
            onClick={syncMode === 'full' ? startFullSync : startIncrementalSync}
            disabled={syncing}
            className={`px-6 py-3 rounded-lg font-medium transition-all ${
              syncing
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {syncing ? (
              <>
                <FaSpinner className="inline animate-spin mr-2" />
                Syncing...
              </>
            ) : (
              <>
                <FaPlay className="inline mr-2" />
                Start {syncMode === 'full' ? 'Full' : 'Incremental'} Sync
              </>
            )}
          </button>

          {syncing && (
            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-blue-800 dark:text-blue-200 font-medium mb-3">
                Data sync in progress... This may take several minutes.
              </p>
              <div className="bg-gray-900 rounded-lg p-4 max-h-96 overflow-y-auto">
                <div className="font-mono text-sm space-y-1">
                  {syncLogs.map((log, idx) => (
                    <div key={idx} className="text-green-400">
                      {log}
                    </div>
                  ))}
                  {syncLogs.length > 0 && (
                    <div className="text-green-400 animate-pulse">▊</div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {scrapeLogs.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-6 p-4">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">Recent Sync History</h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {scrapeLogs.map(log => (
                <div key={log.id} className="flex justify-between items-center text-sm border-b dark:border-gray-700 pb-2">
                  <div className="flex-1">
                    <span className={`inline-block px-2 py-1 rounded text-xs font-medium mr-2 ${
                      log.scrape_type === 'full'
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                        : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    }`}>
                      {log.scrape_type.toUpperCase()}
                    </span>
                    <span className="text-gray-600 dark:text-gray-400">
                      {new Date(log.completed_at).toLocaleString()}
                    </span>
                  </div>
                  <span className="text-gray-800 dark:text-white font-medium text-right">
                    {log.agencies_scraped} agencies • {log.properties_added} new • {log.properties_updated} updated • {Math.floor(log.duration_seconds / 60)}m {log.duration_seconds % 60}s
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="p-6 border-b dark:border-gray-700">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Estate Agents ({filteredAgencies.length})</h2>
              <input
                type="text"
                placeholder="Search agencies..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center p-12">
              <FaSpinner className="animate-spin text-4xl text-blue-600" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
              {filteredAgencies.map(agency => (
                <div
                  key={agency.id}
                  onClick={() => handleAgencyClick(agency)}
                  className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 hover:shadow-lg transition-all cursor-pointer border-2 border-transparent hover:border-blue-500"
                >
                  <div className="flex items-start gap-4 mb-4">
                    {agency.logo_url ? (
                      <img
                        src={agency.logo_url}
                        alt={agency.name}
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                        <FaBuilding className="text-2xl text-blue-600 dark:text-blue-300" />
                      </div>
                    )}
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-1">{agency.name}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {agency.total_properties || 0} properties
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400 mb-4">
                    {agency.phone && <p>📞 {agency.phone}</p>}
                    {agency.email && <p>📧 {agency.email}</p>}
                  </div>

                  {agency.website && (
                    <a
                      href={agency.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-blue-600 dark:text-blue-400 text-sm hover:underline flex items-center gap-1"
                    >
                      Visit website <FaExternalLinkAlt className="text-xs" />
                    </a>
                  )}

                  <div className="mt-4 pt-4 border-t dark:border-gray-600">
                    <p className="text-xs text-gray-500 dark:text-gray-500">
                      Last synced: {new Date(agency.last_scraped_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && filteredAgencies.length === 0 && (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              No agencies found. Run a sync to import data from Daft.ie
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DaftData;
