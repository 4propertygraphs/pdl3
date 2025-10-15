import React, { useState, useEffect } from 'react';
import { FaPlay, FaSpinner, FaDatabase, FaBuilding, FaHome, FaSyncAlt } from 'react-icons/fa';
import Table from '../components/Table';
import SearchBarModal from '../components/SearchBar';

interface DaftProperty {
  id: number;
  daft_id: string;
  title: string;
  price: number;
  address: string;
  property_type: string;
  bedrooms: number;
  bathrooms: number;
  status: string;
  last_scraped_at: string;
}

interface DaftAgency {
  id: number;
  daft_id: string;
  name: string;
  total_properties: number;
  last_scraped_at: string;
}

interface ScrapeLog {
  id: number;
  scrape_type: string;
  properties_scraped: number;
  properties_added: number;
  properties_updated: number;
  duration_seconds: number;
  completed_at: string;
}

const DaftData: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'properties' | 'agencies'>('properties');
  const [properties, setProperties] = useState<DaftProperty[]>([]);
  const [agencies, setAgencies] = useState<DaftAgency[]>([]);
  const [scrapeLogs, setScrapeLogs] = useState<ScrapeLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [scraping, setScraping] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [scrapeMode, setScrapeMode] = useState<'full' | 'incremental'>('full');

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  useEffect(() => {
    loadData();
    loadScrapeLogs();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      const endpoint = activeTab === 'properties' ? 'daft_properties' : 'daft_agencies';
      const response = await fetch(
        `${supabaseUrl}/rest/v1/${endpoint}?select=*&order=last_scraped_at.desc&limit=100`,
        {
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (activeTab === 'properties') {
          setProperties(data);
        } else {
          setAgencies(data);
        }
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
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
          },
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

  const startFullScrape = async () => {
    if (!confirm('Start FULL SCRAPE? This will scrape ALL locations and may take 30-60 minutes.')) {
      return;
    }

    setScraping(true);
    try {
      const response = await fetch(
        `${supabaseUrl}/functions/v1/daft-full-scraper?mode=full&maxPages=10`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${supabaseKey}`,
          },
        }
      );

      if (response.ok) {
        const result = await response.json();
        alert(`Full scrape completed!

Locations: ${result.locationsScraped}
Properties: ${result.totalProperties}
Added: ${result.totalAdded}
Updated: ${result.totalUpdated}
Agencies: ${result.totalAgencies}
Duration: ${Math.floor(result.durationSeconds / 60)} minutes`);
        loadData();
        loadScrapeLogs();
      } else {
        const error = await response.text();
        alert(`Scrape failed: ${error}`);
      }
    } catch (error: any) {
      console.error('Error starting scrape:', error);
      alert('Error: ' + error.message);
    } finally {
      setScraping(false);
    }
  };

  const startIncrementalScrape = async () => {
    setScraping(true);
    try {
      const response = await fetch(
        `${supabaseUrl}/functions/v1/daft-full-scraper?mode=incremental&maxPages=2`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${supabaseKey}`,
          },
        }
      );

      if (response.ok) {
        const result = await response.json();
        alert(`Incremental scrape completed!

Agencies checked: ${result.agenciesChecked}
Duration: ${result.durationSeconds} seconds`);
        loadData();
        loadScrapeLogs();
      }
    } catch (error: any) {
      console.error('Error:', error);
      alert('Error: ' + error.message);
    } finally {
      setScraping(false);
    }
  };

  const filteredProperties = properties.filter(p =>
    p.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.address?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredAgencies = agencies.filter(a =>
    a.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const propertyColumns = [
    { key: 'title' as keyof DaftProperty, label: 'Title' },
    { key: 'address' as keyof DaftProperty, label: 'Address' },
    { key: 'price' as keyof DaftProperty, label: 'Price' },
    { key: 'property_type' as keyof DaftProperty, label: 'Type' },
    { key: 'bedrooms' as keyof DaftProperty, label: 'Beds' },
    { key: 'bathrooms' as keyof DaftProperty, label: 'Baths' },
    { key: 'status' as keyof DaftProperty, label: 'Status' },
  ];

  const agencyColumns = [
    { key: 'name' as keyof DaftAgency, label: 'Agency Name' },
    { key: 'total_properties' as keyof DaftAgency, label: 'Properties' },
    { key: 'last_scraped_at' as keyof DaftAgency, label: 'Last Scraped' },
  ];

  const stats = {
    totalProperties: properties.length,
    totalAgencies: agencies.length,
    lastScrape: scrapeLogs[0]?.completed_at ? new Date(scrapeLogs[0].completed_at).toLocaleString() : 'Never',
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:ml-64">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2 flex items-center gap-2">
            <FaDatabase className="text-blue-600" />
            Daft.ie Scraper
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Automated property scraping from Daft.ie - Full & Incremental modes
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-sm">Total Properties</p>
                <p className="text-2xl font-bold text-gray-800 dark:text-white">{stats.totalProperties}</p>
              </div>
              <FaHome className="text-blue-500" size={32} />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-sm">Total Agencies</p>
                <p className="text-2xl font-bold text-gray-800 dark:text-white">{stats.totalAgencies}</p>
              </div>
              <FaBuilding className="text-green-500" size={32} />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-sm">Last Scrape</p>
                <p className="text-sm font-medium text-gray-800 dark:text-white">{stats.lastScrape}</p>
              </div>
              <FaDatabase className="text-purple-500" size={32} />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-6 p-6">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Scraper Controls</h3>

          <div className="mb-4 flex gap-4">
            <label className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
              <input
                type="radio"
                name="scrapeMode"
                value="full"
                checked={scrapeMode === 'full'}
                onChange={() => setScrapeMode('full')}
                className="text-blue-600"
              />
              <span className="font-medium">Full Scrape</span>
              <span className="text-sm text-gray-500">(All locations, ~30-60 min)</span>
            </label>
            <label className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
              <input
                type="radio"
                name="scrapeMode"
                value="incremental"
                checked={scrapeMode === 'incremental'}
                onChange={() => setScrapeMode('incremental')}
                className="text-blue-600"
              />
              <span className="font-medium">Incremental</span>
              <span className="text-sm text-gray-500">(Check updates only, ~5 min)</span>
            </label>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={scrapeMode === 'full' ? startFullScrape : startIncrementalScrape}
              disabled={scraping}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {scraping ? <FaSpinner className="animate-spin" /> : <FaPlay />}
              {scraping ? 'Scraping...' : `Start ${scrapeMode === 'full' ? 'Full' : 'Incremental'} Scrape`}
            </button>

            <button
              onClick={loadData}
              disabled={loading}
              className="flex items-center gap-2 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50"
            >
              <FaSyncAlt className={loading ? 'animate-spin' : ''} />
              Refresh Data
            </button>
          </div>

          {scraping && (
            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-blue-800 dark:text-blue-200 font-medium">
                Scraping in progress... This may take several minutes. You can leave this page.
              </p>
            </div>
          )}
        </div>

        {scrapeLogs.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-6 p-4">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">Recent Scrape History</h3>
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
                    {log.properties_added} new • {log.properties_updated} updated • {Math.floor(log.duration_seconds / 60)}m {log.duration_seconds % 60}s
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <div className="flex">
              <button
                onClick={() => setActiveTab('properties')}
                className={`px-6 py-3 font-medium ${
                  activeTab === 'properties'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
                }`}
              >
                Properties ({properties.length})
              </button>
              <button
                onClick={() => setActiveTab('agencies')}
                className={`px-6 py-3 font-medium ${
                  activeTab === 'agencies'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
                }`}
              >
                Agencies ({agencies.length})
              </button>
            </div>
          </div>

          <div className="p-4">
            <SearchBarModal
              searchText={searchTerm}
              onSearchChange={(e) => setSearchTerm(e.target.value)}
              placeholder={`Search ${activeTab}...`}
            />

            {loading ? (
              <div className="flex justify-center items-center py-12">
                <FaSpinner className="animate-spin text-4xl text-gray-400" />
              </div>
            ) : activeTab === 'properties' ? (
              <Table
                data={filteredProperties}
                columns={propertyColumns}
                keyField="id"
              />
            ) : (
              <Table
                data={filteredAgencies}
                columns={agencyColumns}
                keyField="id"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DaftData;
