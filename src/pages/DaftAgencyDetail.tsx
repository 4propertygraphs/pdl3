import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaSpinner, FaHome, FaBed, FaBath, FaExternalLinkAlt, FaMapMarkerAlt } from 'react-icons/fa';

interface DaftAgency {
  id: number;
  daft_id: string;
  name: string;
  phone: string;
  email: string;
  website: string;
  logo_url: string;
}

interface DaftProperty {
  id: number;
  daft_id: string;
  title: string;
  price: number;
  address: string;
  property_type: string;
  bedrooms: number;
  bathrooms: number;
  ber_rating: string;
  image_urls: string[];
  latitude: number;
  longitude: number;
  published_date: string;
  last_scraped_at: string;
}

const DaftAgencyDetail: React.FC = () => {
  const { agencyId } = useParams<{ agencyId: string }>();
  const navigate = useNavigate();
  const [agency, setAgency] = useState<DaftAgency | null>(null);
  const [properties, setProperties] = useState<DaftProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  useEffect(() => {
    loadData();
  }, [agencyId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [agencyRes, propertiesRes] = await Promise.all([
        fetch(`${supabaseUrl}/rest/v1/daft_agencies?id=eq.${agencyId}&select=*`, {
          headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
        }),
        fetch(`${supabaseUrl}/rest/v1/daft_properties?agency_id=eq.${agencyId}&select=*&order=published_date.desc`, {
          headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
        }),
      ]);

      if (agencyRes.ok && propertiesRes.ok) {
        const agencyData = await agencyRes.json();
        const propertiesData = await propertiesRes.json();

        setAgency(agencyData[0] || null);
        setProperties(propertiesData);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePropertyClick = (property: DaftProperty) => {
    const daftUrl = `https://www.daft.ie/property-for-sale/ireland/${property.daft_id}`;
    window.open(daftUrl, '_blank');
  };

  const filteredProperties = properties.filter(property =>
    property.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    property.address?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex-1 p-6 bg-gray-50 dark:bg-gray-900 min-h-screen flex items-center justify-center">
        <FaSpinner className="animate-spin text-4xl text-blue-600" />
      </div>
    );
  }

  if (!agency) {
    return (
      <div className="flex-1 p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-gray-600 dark:text-gray-400 mb-4">Agency not found</p>
          <button
            onClick={() => navigate('/daft-data')}
            className="text-blue-600 hover:underline"
          >
            Back to agencies
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <button
          onClick={() => navigate('/daft-data')}
          className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline mb-6"
        >
          <FaArrowLeft /> Back to agencies
        </button>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
          <div className="flex items-start gap-6">
            {agency.logo_url ? (
              <img
                src={agency.logo_url}
                alt={agency.name}
                className="w-24 h-24 object-cover rounded-lg"
              />
            ) : (
              <div className="w-24 h-24 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                <FaHome className="text-4xl text-blue-600 dark:text-blue-300" />
              </div>
            )}

            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">{agency.name}</h1>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {filteredProperties.length} {filteredProperties.length === 1 ? 'property' : 'properties'} available
              </p>

              <div className="flex flex-wrap gap-4 text-sm">
                {agency.phone && (
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <span>📞</span>
                    <span>{agency.phone}</span>
                  </div>
                )}
                {agency.email && (
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <span>📧</span>
                    <a href={`mailto:${agency.email}`} className="hover:underline">
                      {agency.email}
                    </a>
                  </div>
                )}
                {agency.website && (
                  <div className="flex items-center gap-2">
                    <a
                      href={agency.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                    >
                      Visit website <FaExternalLinkAlt className="text-xs" />
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="p-6 border-b dark:border-gray-700">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                Properties ({filteredProperties.length})
              </h2>
              <input
                type="text"
                placeholder="Search properties..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
          </div>

          {filteredProperties.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              No properties found
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
              {filteredProperties.map(property => (
                <div
                  key={property.id}
                  onClick={() => handlePropertyClick(property)}
                  className="bg-gray-50 dark:bg-gray-700 rounded-lg overflow-hidden hover:shadow-xl transition-all cursor-pointer border-2 border-transparent hover:border-blue-500"
                >
                  <div className="relative h-48 bg-gray-200 dark:bg-gray-600">
                    {property.image_urls && property.image_urls.length > 0 ? (
                      <img
                        src={property.image_urls[0]}
                        alt={property.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <FaHome className="text-4xl text-gray-400" />
                      </div>
                    )}
                    {property.ber_rating && (
                      <div className="absolute top-2 right-2 bg-green-600 text-white px-2 py-1 rounded text-xs font-bold">
                        BER {property.ber_rating}
                      </div>
                    )}
                  </div>

                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-lg font-semibold text-gray-800 dark:text-white line-clamp-2">
                        {property.title}
                      </h3>
                    </div>

                    <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400 mb-3">
                      <FaMapMarkerAlt className="text-xs" />
                      <span className="line-clamp-1">{property.address}</span>
                    </div>

                    <div className="flex items-center gap-4 mb-3 text-sm text-gray-600 dark:text-gray-400">
                      {property.bedrooms > 0 && (
                        <div className="flex items-center gap-1">
                          <FaBed />
                          <span>{property.bedrooms}</span>
                        </div>
                      )}
                      {property.bathrooms > 0 && (
                        <div className="flex items-center gap-1">
                          <FaBath />
                          <span>{property.bathrooms}</span>
                        </div>
                      )}
                      {property.property_type && (
                        <span className="text-xs bg-gray-200 dark:bg-gray-600 px-2 py-1 rounded">
                          {property.property_type}
                        </span>
                      )}
                    </div>

                    {property.price > 0 && (
                      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                        €{property.price.toLocaleString()}
                      </div>
                    )}

                    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-500 pt-3 border-t dark:border-gray-600">
                      <span>Listed: {new Date(property.published_date).toLocaleDateString()}</span>
                      <span className="text-blue-600 dark:text-blue-400 flex items-center gap-1">
                        View on Daft <FaExternalLinkAlt />
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DaftAgencyDetail;
