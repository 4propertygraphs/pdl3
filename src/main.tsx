import React, { StrictMode, useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import Dashboard from './pages/Dashboard.tsx';
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Sidebar from './components/Sidebar.tsx';

import Properties from './pages/Properties.tsx';
import Login from './pages/Login.tsx';
import Nopage from './pages/Nopage.tsx';
import apiService from './services/ApiService'; // Gebruik de instantie
import Agencies from './pages/Agencies.tsx';
import FieldMappings from './pages/FieldMappings';

// PrivateRoute component
const PrivateRoute = ({ element }: { element: React.ReactElement }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {


    const verifyToken = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const response = await apiService.verifyToken(token);
          if (response.status === 200) {
            setIsAuthenticated(true);
          } else {
            localStorage.removeItem('token');
            setIsAuthenticated(false);
          }
        } catch (error) {
          console.error('Token verification failed:', error);
          localStorage.removeItem('token');
          setIsAuthenticated(false);
        }
      }
      setLoading(false);
    };
    verifyToken();
  }, []);

  if (loading) {
    return <div className='dark:text-gray-300'>Loading...</div>;
  }

  return isAuthenticated ? element : <Navigate to="/login" />;
};

const App = () => {
  const token = localStorage.getItem('token'); // Fix: get token directly

  // Get basename from env
  let basename = import.meta.env.VITE_REACT_APP_FILE_LOCATION || '/';
  if (!basename.startsWith('/')) {
    basename = '/' + basename;
  }

  // Logout component

  return (
    <StrictMode>
      <BrowserRouter basename={basename}>
        <Routes>
          <Route
            path="/login"
            element={token ? <Navigate to="/agencies" replace /> : <Login />}
          />
          <Route
            path="*"
            element={
              <div className="flex bg-gray-100 dark:bg-gray-800">
                <Sidebar />
                <div className="flex-1">
                  <Routes>
                    <Route path="/" element={<Navigate to="/agencies" />} />
                    <Route path="/dashboard" element={<Dashboard />} />

                    <Route path="/properties/:agencySlug" element={<Properties />} />
                    <Route path="/agencies" element={<Agencies />} />
                    <Route path="/field-mappings" element={<PrivateRoute element={<FieldMappings />} />} />

                    <Route path="*" element={<Nopage />} />
                  </Routes>
                </div>
              </div>
            }
          />
        </Routes>
      </BrowserRouter>
    </StrictMode>
  );
};

createRoot(document.getElementById('root')!).render(<App />);