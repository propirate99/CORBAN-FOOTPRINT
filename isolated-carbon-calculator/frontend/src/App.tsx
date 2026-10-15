import React from 'react';
import { CarbonCalculator } from './components/CarbonCalculator';

export const App: React.FC = () => {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f1f5f9', padding: '2rem 1rem' }}>
      <div style={{ maxWidth: '960px', margin: '0 auto', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
          Isolated Sandbox Environment • Port 5175
        </div>
        <div style={{ fontSize: '0.8rem', background: '#e2e8f0', padding: '4px 8px', borderRadius: '4px', color: '#334155' }}>
          Backend Proxy: <code>http://127.0.0.1:8085</code>
        </div>
      </div>

      <CarbonCalculator />
    </div>
  );
};

export default App;
