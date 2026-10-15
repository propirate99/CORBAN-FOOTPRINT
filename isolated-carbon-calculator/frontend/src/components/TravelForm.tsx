import React, { useState } from 'react';
import { calculatorApi } from '../api/calculatorApi';
import { CalculationResult } from '../types/calculator';

interface Props {
  apiBaseUrl?: string;
  onResult: (result: CalculationResult) => void;
  onInputChange: () => void;
}

export const TravelForm: React.FC<Props> = ({ apiBaseUrl, onResult, onInputChange }) => {
  const [fuelType, setFuelType] = useState<'PETROL' | 'DIESEL'>('PETROL');
  const [method, setMethod] = useState<'distance' | 'fuel'>('distance');
  const [fuelLitres, setFuelLitres] = useState<string>('2');
  const [distanceKm, setDistanceKm] = useState<string>('20');
  const [mileageKmPerLitre, setMileageKmPerLitre] = useState<string>('40');
  const [occupants, setOccupants] = useState<string>('1');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const handleFieldChange = (field: string, value: string) => {
    if (field === 'fuelLitres') setFuelLitres(value);
    if (field === 'distanceKm') setDistanceKm(value);
    if (field === 'mileageKmPerLitre') setMileageKmPerLitre(value);
    if (field === 'occupants') setOccupants(value);

    setErrors((prev) => {
      const copy = { ...prev };
      delete copy[field];
      return copy;
    });
    setFormError(null);
    onInputChange();
  };

  const handleMethodChange = (newMethod: 'distance' | 'fuel') => {
    setMethod(newMethod);
    setErrors({});
    setFormError(null);
    onInputChange();
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!occupants.trim()) {
      newErrors.occupants = 'Occupants is required.';
    } else {
      const occ = Number(occupants);
      if (!Number.isInteger(occ) || occ < 1 || occ > 100) {
        newErrors.occupants = 'Occupants must be a whole integer from 1 to 100.';
      }
    }

    if (method === 'fuel') {
      if (!fuelLitres.trim()) {
        newErrors.fuelLitres = 'Fuel consumed in litres is required.';
      } else {
        const litres = Number(fuelLitres);
        if (isNaN(litres) || litres < 0) {
          newErrors.fuelLitres = 'Fuel litres cannot be negative.';
        } else if (litres > 50000) {
          newErrors.fuelLitres = 'Fuel litres exceeds maximum limit of 50,000 L.';
        }
      }
    } else {
      if (!distanceKm.trim()) {
        newErrors.distanceKm = 'Distance in km is required.';
      } else {
        const d = Number(distanceKm);
        if (isNaN(d) || d < 0) {
          newErrors.distanceKm = 'Distance cannot be negative.';
        } else if (d > 1000000) {
          newErrors.distanceKm = 'Distance exceeds maximum limit of 1,000,000 km.';
        }
      }

      if (!mileageKmPerLitre.trim()) {
        newErrors.mileageKmPerLitre = 'Mileage (km/L) is required.';
      } else {
        const m = Number(mileageKmPerLitre);
        if (isNaN(m) || m <= 0) {
          newErrors.mileageKmPerLitre = 'Mileage must be strictly greater than zero.';
        } else if (m > 1000) {
          newErrors.mileageKmPerLitre = 'Mileage exceeds reasonable limit of 1,000 km/L.';
        }
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
      const payload: any = {
        fuelType,
        occupants: parseInt(occupants, 10),
      };

      if (method === 'fuel') {
        payload.fuelLitres = parseFloat(fuelLitres);
      } else {
        payload.distanceKm = parseFloat(distanceKm);
        payload.mileageKmPerLitre = parseFloat(mileageKmPerLitre);
      }

      const result = await calculatorApi.calculateTravel(payload, apiBaseUrl);
      onResult(result);
    } catch (err: any) {
      setFormError(err.message || 'Failed to calculate travel emissions');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFuelLitres('');
    setDistanceKm('');
    setMileageKmPerLitre('');
    setOccupants('1');
    setErrors({});
    setFormError(null);
    onInputChange();
  };

  return (
    <form onSubmit={handleCalculate} aria-label="Travel carbon calculation form">
      <h3 className="isolated-calc-form-title">🚗 Travel & Commute Emissions</h3>

      {formError && (
        <div className="isolated-calc-error-banner" role="alert">
          <span>⚠️</span>
          <div>{formError}</div>
        </div>
      )}

      {/* Fuel Type Selection */}
      <div className="isolated-calc-form-group">
        <label className="isolated-calc-label">Fuel Type</label>
        <div className="isolated-calc-radio-group">
          <div
            className={`isolated-calc-radio-card ${fuelType === 'PETROL' ? 'active' : ''}`}
            onClick={() => {
              setFuelType('PETROL');
              onInputChange();
            }}
            role="radio"
            aria-checked={fuelType === 'PETROL'}
            tabIndex={0}
          >
            <span>⛽</span> Petrol (Gasoline)
          </div>
          <div
            className={`isolated-calc-radio-card ${fuelType === 'DIESEL' ? 'active' : ''}`}
            onClick={() => {
              setFuelType('DIESEL');
              onInputChange();
            }}
            role="radio"
            aria-checked={fuelType === 'DIESEL'}
            tabIndex={0}
          >
            <span>🛢️</span> Diesel
          </div>
        </div>
      </div>

      {/* Method Selection */}
      <div className="isolated-calc-form-group">
        <label className="isolated-calc-label">Calculation Method (Choose exactly one)</label>
        <div className="isolated-calc-radio-group">
          <div
            className={`isolated-calc-radio-card ${method === 'distance' ? 'active' : ''}`}
            onClick={() => handleMethodChange('distance')}
            role="radio"
            aria-checked={method === 'distance'}
            tabIndex={0}
          >
            📏 Distance & Mileage
          </div>
          <div
            className={`isolated-calc-radio-card ${method === 'fuel' ? 'active' : ''}`}
            onClick={() => handleMethodChange('fuel')}
            role="radio"
            aria-checked={method === 'fuel'}
            tabIndex={0}
          >
            ⛽ Direct Fuel Litres
          </div>
        </div>
      </div>

      {/* Method 1: Distance & Mileage */}
      {method === 'distance' ? (
        <>
          <div className="isolated-calc-form-group">
            <label htmlFor="travel-distance" className="isolated-calc-label">
              Trip Distance
            </label>
            <div className="isolated-calc-input-wrapper">
              <input
                id="travel-distance"
                type="number"
                min="0"
                max="1000000"
                step="any"
                className="isolated-calc-input"
                placeholder="e.g. 20"
                value={distanceKm}
                onChange={(e) => handleFieldChange('distanceKm', e.target.value)}
                disabled={loading}
              />
              <span className="isolated-calc-unit-badge">km</span>
            </div>
            {errors.distanceKm && <div className="isolated-calc-field-error">{errors.distanceKm}</div>}
          </div>

          <div className="isolated-calc-form-group">
            <label htmlFor="travel-mileage" className="isolated-calc-label">
              Vehicle Fuel Economy (Mileage)
            </label>
            <div className="isolated-calc-input-wrapper">
              <input
                id="travel-mileage"
                type="number"
                min="0.1"
                max="1000"
                step="any"
                className="isolated-calc-input"
                placeholder="e.g. 40"
                value={mileageKmPerLitre}
                onChange={(e) => handleFieldChange('mileageKmPerLitre', e.target.value)}
                disabled={loading}
              />
              <span className="isolated-calc-unit-badge">km / Litre</span>
            </div>
            {errors.mileageKmPerLitre && <div className="isolated-calc-field-error">{errors.mileageKmPerLitre}</div>}
          </div>
        </>
      ) : (
        /* Method 2: Fuel Litres */
        <div className="isolated-calc-form-group">
          <label htmlFor="travel-fuel" className="isolated-calc-label">
            Actual Fuel Used
          </label>
          <div className="isolated-calc-input-wrapper">
            <input
              id="travel-fuel"
              type="number"
              min="0"
              max="50000"
              step="any"
              className="isolated-calc-input"
              placeholder="e.g. 2"
              value={fuelLitres}
              onChange={(e) => handleFieldChange('fuelLitres', e.target.value)}
              disabled={loading}
            />
            <span className="isolated-calc-unit-badge">Litres</span>
          </div>
          {errors.fuelLitres && <div className="isolated-calc-field-error">{errors.fuelLitres}</div>}
        </div>
      )}

      {/* Occupants */}
      <div className="isolated-calc-form-group">
        <label htmlFor="travel-occupants" className="isolated-calc-label">
          Trip Occupants (Carpooled / Shared)
        </label>
        <div className="isolated-calc-input-wrapper">
          <input
            id="travel-occupants"
            type="number"
            min="1"
            max="100"
            step="1"
            className="isolated-calc-input"
            placeholder="e.g. 1"
            value={occupants}
            onChange={(e) => handleFieldChange('occupants', e.target.value)}
            disabled={loading}
          />
          <span className="isolated-calc-unit-badge">Occupants</span>
        </div>
        {errors.occupants && <div className="isolated-calc-field-error">{errors.occupants}</div>}
      </div>

      <div className="isolated-calc-actions">
        <button type="submit" className="isolated-calc-btn-primary" disabled={loading}>
          {loading ? 'Calculating...' : 'Calculate Travel CO2'}
        </button>
        <button type="button" className="isolated-calc-btn-secondary" onClick={handleReset} disabled={loading}>
          Reset
        </button>
      </div>
    </form>
  );
};
