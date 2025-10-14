import { useState } from 'react';

interface MigrationProgress {
  table: string;
  migrated: number;
  total: number;
  status: 'pending' | 'migrating' | 'completed' | 'error';
  error?: string;
}

const TABLES = ['agencies', 'properties', 'properties_data', 'field_mappings'];

export function DataMigration() {
  const [progress, setProgress] = useState<MigrationProgress[]>(
    TABLES.map(table => ({
      table,
      migrated: 0,
      total: 0,
      status: 'pending'
    }))
  );
  const [isRunning, setIsRunning] = useState(false);

  const migrateTable = async (tableName: string, tableIndex: number) => {
    setProgress(prev =>
      prev.map((p, i) =>
        i === tableIndex ? { ...p, status: 'migrating' } : p
      )
    );

    let offset = 0;
    let totalMigrated = 0;
    const batchSize = 100;

    try {
      while (true) {
        const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/migrate-step`;
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            table: tableName,
            batchSize,
            offset
          })
        });

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error || 'Migration failed');
        }

        totalMigrated += result.migrated;

        setProgress(prev =>
          prev.map((p, i) =>
            i === tableIndex ? { ...p, migrated: totalMigrated } : p
          )
        );

        if (!result.hasMore) {
          setProgress(prev =>
            prev.map((p, i) =>
              i === tableIndex ? { ...p, status: 'completed', total: totalMigrated } : p
            )
          );
          break;
        }

        offset = result.nextOffset;
      }
    } catch (error) {
      setProgress(prev =>
        prev.map((p, i) =>
          i === tableIndex ? {
            ...p,
            status: 'error',
            error: error instanceof Error ? error.message : 'Unknown error'
          } : p
        )
      );
    }
  };

  const startMigration = async () => {
    setIsRunning(true);

    for (let i = 0; i < TABLES.length; i++) {
      await migrateTable(TABLES[i], i);
    }

    setIsRunning(false);
  };

  const resetMigration = () => {
    setProgress(
      TABLES.map(table => ({
        table,
        migrated: 0,
        total: 0,
        status: 'pending'
      }))
    );
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Data Migration</h2>

      <div className="space-y-4 mb-6">
        {progress.map((item) => (
          <div key={item.table} className="border rounded-lg p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="font-semibold capitalize">{item.table}</span>
              <span className={`px-3 py-1 rounded text-sm ${
                item.status === 'completed' ? 'bg-green-100 text-green-800' :
                item.status === 'migrating' ? 'bg-blue-100 text-blue-800' :
                item.status === 'error' ? 'bg-red-100 text-red-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {item.status}
              </span>
            </div>

            {item.status === 'migrating' && (
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: '50%' }}></div>
              </div>
            )}

            {item.status === 'completed' && (
              <p className="text-sm text-gray-600">Migrated {item.total} records</p>
            )}

            {item.status === 'error' && (
              <p className="text-sm text-red-600">{item.error}</p>
            )}
          </div>
        ))}
      </div>

      <div className="flex gap-4">
        <button
          onClick={startMigration}
          disabled={isRunning}
          className={`flex-1 py-2 px-4 rounded font-semibold ${
            isRunning
              ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {isRunning ? 'Migrating...' : 'Start Migration'}
        </button>

        <button
          onClick={resetMigration}
          disabled={isRunning}
          className={`py-2 px-4 rounded font-semibold ${
            isRunning
              ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
              : 'bg-gray-600 text-white hover:bg-gray-700'
          }`}
        >
          Reset
        </button>
      </div>
    </div>
  );
}
