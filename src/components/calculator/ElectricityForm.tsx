import React, { useState } from 'react';
import { calculatorApi } from './api/calculatorApi';
import { CalculationResult } from './types/calculator';

interface Props {
  apiBaseUrl?: string;
  onResult: (result: CalculationResult) => void;
  onInputChange: () => void;
}

export const ElectricityForm: React.FC<Props> = ({ apiBaseUrl, onResult, onInputChange }) => {
  const [kwh, setKwh] = useState<string>('100');
  const [error, setError] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const handleInputChange = (val: string) => {
    setKwh(val);
    setFieldError(null);
    setError(null);
    onInputChange();
  };

  const validate = (): boolean => {
    if (kwh.trim() === '') {
      setFieldError('kWh consumption is required.');
      return false;
    }
    const num = Number(kwh);
    if (isNaN(num)) {
      setFieldError('Please enter a valid numeric value.');
      return false;
    }
    if (num < 0) {
      setFieldError('kWh consumption cannot be negative.');
      return false;
    }
    if (num > 10000000) {
      setFieldError('kWh value exceeds maximum allowable limit of 10,000,000.');
      return false;
    }
    return true;
  };

  const handleCalculate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setError(null);
    try {
      const result = await calculatorApi.calculateElectricity(Number(kwh), apiBaseUrl);
      onResult(result);
    } catch (err: any) {
      setError(err.message || 'Failed to calculate electricity emissions');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setKwh('');
    setFieldError(null);
    setError(null);
    onInputChange();
  };

  return (
    <form onSubmit={handleCalculate} aria-label="Electricity carbon calculation form">
      <h3 className="isolated-calc-form-title">⚡ Electricity Consumption</h3>

      {error && (
        <div className="isolated-calc-error-banner" role="alert">
          <span>⚠️</span>
          <div>{error}</div>
        </div>
      )}

      <div className="isolated-calc-form-group">
        <label htmlFor="kwh-input" className="isolated-calc-label">
          Electricity Consumed
        </label>
        <div className="isolated-calc-input-wrapper">
          <input
            id="kwh-input"
            type="number"
            step="any"
            min="0"
            max="10000000"
            className="isolated-calc-input"
            placeholder="e.g. 100"
            value={kwh}
            onChange={(e) => handleInputChange(e.target.value)}
            disabled={loading}
            aria-invalid={!!fieldError}
            aria-describedby={fieldError ? 'kwh-error' : undefined}
          />
          <span className="isolated-calc-unit-badge">kWh</span>
        </div>
        {fieldError && (
          <div id="kwh-error" className="isolated-calc-field-error">
            {fieldError}
          </div>
        )}
      </div>

      <div className="isolated-calc-actions">
        <button
          type="submit"
          className="isolated-calc-btn-primary"
          disabled={loading}
        >
          {loading ? 'Calculating...' : 'Calculate Electricity CO2'}
        </button>
        <button
          type="button"
          className="isolated-calc-btn-secondary"
          onClick={handleReset}
          disabled={loading}
        >
          Reset
        </button>
      </div>
    </form>
  );
};
