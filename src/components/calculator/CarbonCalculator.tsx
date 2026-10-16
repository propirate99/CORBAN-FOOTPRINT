import React, { useState } from 'react';
import { CalculationResult } from './types/calculator';
import { ElectricityForm } from './ElectricityForm';
import { EquipmentForm } from './EquipmentForm';
import { TravelForm } from './TravelForm';
import { ResultCard } from './ResultCard';
import './styles/calculator.css';

export interface CarbonCalculatorProps {
  apiBaseUrl?: string;
  className?: string;
}

type TabType = 'electricity' | 'equipment' | 'travel';

export const CarbonCalculator: React.FC<CarbonCalculatorProps> = ({ apiBaseUrl, className }) => {
  const [activeTab, setActiveTab] = useState<TabType>('electricity');
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [isStale, setIsStale] = useState<boolean>(false);

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setResult(null);
    setIsStale(false);
  };

  const handleResult = (newResult: CalculationResult) => {
    setResult(newResult);
    setIsStale(false);
  };

  const handleInputChange = () => {
    if (result) {
      setIsStale(true);
    }
  };

  return (
    <div className={`isolated-calc-root ${className || ''}`}>
      {/* Header */}
      <div className="isolated-calc-header">
        <h2 className="isolated-calc-title">
          <span>🌱</span> Campus Activity Carbon Calculator
        </h2>
        <p className="isolated-calc-subtitle">
          Independent, deterministic calculation engine for campus energy and travel carbon emissions.
        </p>

        {/* Reference Factor & Scope Notice */}
        <div className="isolated-calc-notice-banner">
          <span>ℹ️</span>
          <div>
            <strong>Notice:</strong> Estimated CO2 from the activities entered. Grid factor uses India CEA FY22-23 demonstration standard (0.716 kg CO2/kWh). Travel factors use US EPA tailpipe reference; not India-blend-specific. Excludes upstream fuel production and other lifecycle emissions.
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="isolated-calc-tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'electricity'}
          className={`isolated-calc-tab-btn ${activeTab === 'electricity' ? 'active' : ''}`}
          onClick={() => handleTabChange('electricity')}
        >
          <span>⚡</span> Electricity
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'equipment'}
          className={`isolated-calc-tab-btn ${activeTab === 'equipment' ? 'active' : ''}`}
          onClick={() => handleTabChange('equipment')}
        >
          <span>🖥️</span> Equipment
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'travel'}
          className={`isolated-calc-tab-btn ${activeTab === 'travel' ? 'active' : ''}`}
          onClick={() => handleTabChange('travel')}
        >
          <span>🚗</span> Travel & Commute
        </button>
      </div>

      {/* Main Grid */}
      <div className="isolated-calc-grid">
        <div className="isolated-calc-card">
          {activeTab === 'electricity' && (
            <ElectricityForm
              apiBaseUrl={apiBaseUrl}
              onResult={handleResult}
              onInputChange={handleInputChange}
            />
          )}
          {activeTab === 'equipment' && (
            <EquipmentForm
              apiBaseUrl={apiBaseUrl}
              onResult={handleResult}
              onInputChange={handleInputChange}
            />
          )}
          {activeTab === 'travel' && (
            <TravelForm
              apiBaseUrl={apiBaseUrl}
              onResult={handleResult}
              onInputChange={handleInputChange}
            />
          )}
        </div>

        <div>
          <ResultCard result={result} isStale={isStale} />
        </div>
      </div>
    </div>
  );
};

export default CarbonCalculator;
