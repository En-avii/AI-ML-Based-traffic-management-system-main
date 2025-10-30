import React from 'react';
import { Toaster } from 'react-hot-toast';
import TrafficDashboard from './components/TrafficDashboard'; // ✅ Default import

const App: React.FC = () => {
  return (
    <>
      {/* Global toaster for notifications */}
      <Toaster
        position="top-right"
        reverseOrder={false}
        gutter={8}
        toastOptions={{
          className: '',
          duration: 4000,
          style: {
            background: '#374151',
            color: '#F9FAFB',
            fontSize: '14px',
            borderRadius: '8px',
            boxShadow:
              '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#34D399',
              secondary: '#F9FAFB',
            },
          },
          error: {
            duration: 5000,
            iconTheme: {
              primary: '#F87171',
              secondary: '#F9FAFB',
            },
          },
          loading: {
            iconTheme: {
              primary: '#60A5FA',
              secondary: '#E5E7EB',
            },
          },
        }}
      />

      {/* Main Dashboard */}
      <TrafficDashboard />
    </>
  );
};

export default App;
