import React, { useState } from 'react';
import { calculatorApi } from './api/calculatorApi';
import { CalculationResult } from './types/calculator';

interface Props {
  apiBaseUrl?: string;
  onResult: (result: CalculationResult) => void;
  onInputChange: () => void;
}

export const EquipmentForm: React.FC<Props> = ({ apiBaseUrl, onResult, onInputChange }) => {
  const [quantity, setQuantity] = useState<string>('8');
  const [wattsPerUnit, setWattsPerUnit] = useState<string>('20');
  const [hoursPerDay, setHoursPerDay] = useState<string>('2');
  const [days, setDays] = useState<string>('1');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const handleFieldChange = (field: string, value: string) => {
    if (field === 'quantity') setQuantity(value);
    if (field === 'wattsPerUnit') setWattsPerUnit(value);
    if (field === 'hoursPerDay') setHoursPerDay(value);
    if (field === 'days') setDays(value);

    setErrors((prev) => {
      const copy = { ...prev };
      delete copy[field];
      return copy;
    });
    setFormError(null);
    onInputChange();
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!quantity.trim()) {
      newErrors.quantity = 'Number of devices is required.';
    } else {
      const q = Number(quantity);
      if (!Number.isInteger(q) || q < 1) {
        newErrors.quantity = 'Quantity must be a positive whole integer (at least 1).';
      } else if (q > 100000) {
        newErrors.quantity = 'Quantity cannot exceed 100,000 devices.';
      }
    }

    if (!wattsPerUnit.trim()) {
      newErrors.wattsPerUnit = 'Rated power in watts is required.';
    } else {
      const w = Number(wattsPerUnit);
      if (isNaN(w) || w < 0) {
        newErrors.wattsPerUnit = 'Rated watts cannot be negative.';
      } else if (w > 1000000) {
        newErrors.wattsPerUnit = 'Rated watts cannot exceed 1,000,000 W.';
      }
    }

    if (!hoursPerDay.trim()) {
      newErrors.hoursPerDay = 'Hours per day is required.';
    } else {
      const h = Number(hoursPerDay);
      if (isNaN(h) || h < 0 || h > 24) {
        newErrors.hoursPerDay = 'Operating hours per day must be between 0 and 24.';
      }
    }

    if (!days.trim()) {
      newErrors.days = 'Number of days is required.';
    } else {
      const d = Number(days);
      if (!Number.isInteger(d) || d < 1 || d > 366) {
        newErrors.days = 'Days must be an integer between 1 and 366.';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCalculate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setFormError(null);
    try {
      const result = await calculatorApi.calculateEquipment(
        {
          quantity: parseInt(quantity, 10),
          wattsPerUnit: parseFloat(wattsPerUnit),
          hoursPerDay: parseFloat(hoursPerDay),
          days: parseInt(days, 10),
        },
        apiBaseUrl
      );
      onResult(result);
    } catch (err: any) {
      setFormError(err.message || 'Failed to calculate equipment emissions');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setQuantity('');
    setWattsPerUnit('');
    setHoursPerDay('');
    setDays('');
    setErrors({});
    setFormError(null);
    onInputChange();
  };

  return (
    <form onSubmit={handleCalculate} aria-label="Equipment carbon calculation form">
      <h3 className="isolated-calc-form-title">🖥️ Equipment & Device Energy</h3>

      {formError && (
        <div className="isolated-calc-error-banner" role="alert">
          <span>⚠️</span>
          <div>{formError}</div>
        </div>
      )}

      <div className="isolated-calc-form-group">
        <label htmlFor="eq-quantity" className="isolated-calc-label">
          Number of Devices
        </label>
        <div className="isolated-calc-input-wrapper">
          <input
            id="eq-quantity"
            type="number"
            min="1"
            max="100000"
            step="1"
            className="isolated-calc-input"
            placeholder="e.g. 8"
            value={quantity}
            onChange={(e) => handleFieldChange('quantity', e.target.value)}
            disabled={loading}
          />
          <span className="isolated-calc-unit-badge">Units</span>
        </div>
        {errors.quantity && <div className="isolated-calc-field-error">{errors.quantity}</div>}
      </div>

      <div className="isolated-calc-form-group">
        <label htmlFor="eq-watts" className="isolated-calc-label">
          Rated Power per Device
        </label>
        <div className="isolated-calc-input-wrapper">
          <input
            id="eq-watts"
            type="number"
            min="0"
            max="1000000"
            step="any"
            className="isolated-calc-input"
            placeholder="e.g. 20"
            value={wattsPerUnit}
            onChange={(e) => handleFieldChange('wattsPerUnit', e.target.value)}
            disabled={loading}
          />
          <span className="isolated-calc-unit-badge">Watts (W)</span>
        </div>
        {errors.wattsPerUnit && <div className="isolated-calc-field-error">{errors.wattsPerUnit}</div>}
      </div>

      <div className="isolated-calc-form-group">
        <label htmlFor="eq-hours" className="isolated-calc-label">
          Operating Hours per Day
        </label>
        <div className="isolated-calc-input-wrapper">
          <input
            id="eq-hours"
            type="number"
            min="0"
            max="24"
            step="any"
            className="isolated-calc-input"
            placeholder="e.g. 2"
            value={hoursPerDay}
            onChange={(e) => handleFieldChange('hoursPerDay', e.target.value)}
            disabled={loading}
          />
          <span className="isolated-calc-unit-badge">Hours / Day</span>
        </div>
        {errors.hoursPerDay && <div className="isolated-calc-field-error">{errors.hoursPerDay}</div>}
      </div>

      <div className="isolated-calc-form-group">
        <label htmlFor="eq-days" className="isolated-calc-label">
          Duration in Days
        </label>
        <div className="isolated-calc-input-wrapper">
          <input
            id="eq-days"
            type="number"
            min="1"
            max="366"
            step="1"
            className="isolated-calc-input"
            placeholder="e.g. 1"
            value={days}
            onChange={(e) => handleFieldChange('days', e.target.value)}
            disabled={loading}
          />
          <span className="isolated-calc-unit-badge">Days</span>
        </div>
        {errors.days && <div className="isolated-calc-field-error">{errors.days}</div>}
      </div>

      <div className="isolated-calc-actions">
        <button type="submit" className="isolated-calc-btn-primary" disabled={loading}>
          {loading ? 'Calculating...' : 'Calculate Equipment CO2'}
        </button>
        <button type="button" className="isolated-calc-btn-secondary" onClick={handleReset} disabled={loading}>
          Reset
        </button>
      </div>
    </form>
  );
};
