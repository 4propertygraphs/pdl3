import React, { useState } from 'react';
import { FaPlay, FaSpinner, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';

interface DebugResult {
  success: boolean;
  url: string;
  status: number;
  htmlLength: number;
  checks: {
    hasNextData: boolean;
    hasListings: boolean;
    listingsCount: number;
    hasTitle: boolean;
    hasBody: boolean;
    hasHead: boolean;
    hasReact: boolean;
    hasCloudflare: boolean;
    hasCaptcha: boolean;
  };
  htmlPreview: string;
  htmlEnd: string;
  nextDataSample?: any;
  error?: string;
}

const DebugScraper: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DebugResult | null>(null);
  const [testUrl, setTestUrl] = useState('https://www.daft.ie/property-for-sale/dublin?offset=0');

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

  const runDebug = async () => {
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch(
        `${supabaseUrl}/functions/v1/daft-debug?url=${encodeURIComponent(testUrl)}`
      );
      const data = await response.json();
      setResult(data);
    } catch (error: any) {
      setResult({
        success: false,
        error: error.message,
        url: testUrl,
        status: 0,
        htmlLength: 0,
        checks: {
          hasNextData: false,
          hasListings: false,
          listingsCount: 0,
          hasTitle: false,
          hasBody: false,
          hasHead: false,
          hasReact: false,
          hasCloudflare: false,
          hasCaptcha: false,
        },
        htmlPreview: '',
        htmlEnd: '',
      });
    } finally {
      setLoading(false);
    }
  };

  const testUrls = [
    'https://www.daft.ie/property-for-sale/dublin?offset=0',
    'https://www.daft.ie/property-for-sale/cork?offset=0',
    'https://www.daft.ie/property-for-sale/galway?offset=0',
    'https://ww1.daft.ie/dublin/estate-agents/',
  ];

  return (
    <div className="flex-1 p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">Scraper Debug Tool</h1>
          <p className="text-gray-600 dark:text-gray-400">Test what the scraper sees when fetching Daft.ie</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Test URL
          </label>
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={testUrl}
              onChange={(e) => setTestUrl(e.target.value)}
              className="flex-1 px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="Enter URL to test..."
            />
            <button
              onClick={runDebug}
              disabled={loading}
              className={`px-6 py-2 rounded-lg font-medium transition-all ${
                loading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {loading ? (
                <>
                  <FaSpinner className="inline animate-spin mr-2" />
                  Testing...
                </>
              ) : (
                <>
                  <FaPlay className="inline mr-2" />
                  Run Test
                </>
              )}
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">Quick tests:</span>
            {testUrls.map((url, idx) => (
              <button
                key={idx}
                onClick={() => setTestUrl(url)}
                className="text-xs px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
              >
                {url.includes('estate-agents') ? 'Agencies' : url.match(/\/(dublin|cork|galway)/)?.[1] || 'Test'}
              </button>
            ))}
          </div>
        </div>

        {result && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
                {result.success ? (
                  <span className="text-green-600 flex items-center gap-2">
                    <FaCheckCircle /> Test Successful
                  </span>
                ) : (
                  <span className="text-red-600 flex items-center gap-2">
                    <FaTimesCircle /> Test Failed
                  </span>
                )}
              </h2>

              {result.error && (
                <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-red-800 dark:text-red-200 font-mono text-sm">{result.error}</p>
                </div>
              )}

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">HTTP Status</p>
                  <p className="text-2xl font-bold text-gray-800 dark:text-white">
                    {result.status}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">HTML Size</p>
                  <p className="text-2xl font-bold text-gray-800 dark:text-white">
                    {(result.htmlLength / 1024).toFixed(1)} KB
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Listings Found</p>
                  <p className="text-2xl font-bold text-gray-800 dark:text-white">
                    {result.checks.listingsCount}
                  </p>
                </div>
              </div>

              <div className="border-t dark:border-gray-700 pt-4">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">Checks</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {Object.entries(result.checks).map(([key, value]) => (
                    <div
                      key={key}
                      className={`flex items-center gap-2 p-3 rounded-lg ${
                        value
                          ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                          : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                      }`}
                    >
                      {value ? (
                        <FaCheckCircle className="text-green-600 dark:text-green-400" />
                      ) : (
                        <FaTimesCircle className="text-red-600 dark:text-red-400" />
                      )}
                      <span className={`text-sm ${
                        value ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'
                      }`}>
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                        {typeof value === 'number' && value > 0 ? ` (${value})` : ''}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {result.nextDataSample && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">
                  __NEXT_DATA__ Sample
                </h3>
                <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto text-xs">
                  {JSON.stringify(result.nextDataSample, null, 2)}
                </pre>
              </div>
            )}

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">
                HTML Preview (First 2000 chars)
              </h3>
              <pre className="bg-gray-900 text-gray-300 p-4 rounded-lg overflow-x-auto text-xs max-h-96 overflow-y-auto">
                {result.htmlPreview}
              </pre>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">
                HTML End (Last 500 chars)
              </h3>
              <pre className="bg-gray-900 text-gray-300 p-4 rounded-lg overflow-x-auto text-xs">
                {result.htmlEnd}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DebugScraper;
