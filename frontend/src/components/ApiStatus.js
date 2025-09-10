import React, { useState, useEffect } from 'react';

const ApiStatus = () => {
  const [apiStatus, setApiStatus] = useState({
    loading: true,
    connected: false,
    error: null,
    responseTime: null,
    dataSize: null
  });

  useEffect(() => {
    testTanzilApi();
  }, []);

  const testTanzilApi = async () => {
    const startTime = Date.now();
    
    try {
      setApiStatus(prev => ({ ...prev, loading: true, error: null }));
      
      // Test with a simple API call
      const response = await fetch('https://api.alquran.cloud/v1/quran/quran-uthmani');
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      const responseTime = Date.now() - startTime;
      
      if (data.status === 'OK') {
        setApiStatus({
          loading: false,
          connected: true,
          error: null,
          responseTime: responseTime,
          dataSize: JSON.stringify(data).length
        });
      } else {
        throw new Error(`API Error: ${data.message || 'Unknown error'}`);
      }
    } catch (error) {
      setApiStatus({
        loading: false,
        connected: false,
        error: error.message,
        responseTime: null,
        dataSize: null
      });
    }
  };

  const retryConnection = () => {
    testTanzilApi();
  };

  return (
    <div style={{
      padding: '15px',
      margin: '10px 0',
      borderRadius: '8px',
      border: '1px solid #e5e7eb',
      backgroundColor: '#f9fafb'
    }}>
      <h4 style={{ margin: '0 0 10px 0', color: '#374151' }}>
        🌐 Tanzil API Status
      </h4>
      
      {apiStatus.loading && (
        <div style={{ color: '#6b7280' }}>
          🔄 Testing API connection...
        </div>
      )}
      
      {!apiStatus.loading && apiStatus.connected && (
        <div style={{ color: '#059669' }}>
          ✅ <strong>Connected to Tanzil API</strong>
          <div style={{ fontSize: '12px', marginTop: '5px', color: '#6b7280' }}>
            Response time: {apiStatus.responseTime}ms • Data size: {Math.round(apiStatus.dataSize / 1024)}KB
          </div>
        </div>
      )}
      
      {!apiStatus.loading && !apiStatus.connected && (
        <div style={{ color: '#dc2626' }}>
          ❌ <strong>API Connection Failed</strong>
          <div style={{ fontSize: '12px', marginTop: '5px', color: '#6b7280' }}>
            Error: {apiStatus.error}
          </div>
          <button 
            onClick={retryConnection}
            style={{
              marginTop: '8px',
              padding: '4px 8px',
              fontSize: '12px',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            🔄 Retry Connection
          </button>
        </div>
      )}
    </div>
  );
};

export default ApiStatus;
