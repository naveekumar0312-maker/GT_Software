import React, { useMemo } from 'react';
import DatePicker from './DatePicker';
import CustomDropdown from './CustomDropdown';
import { formatINR } from './ServicesClient';
import '../styles/FinalReportGST.css';

/**
 * Decimal safe currency math helpers
 */
export const calculateGSTAmount = (baseTotalCost, gstPercentage, gstCollected) => {
  if (!gstCollected) return 0;
  const base = parseFloat(baseTotalCost) || 0;
  const pct = parseFloat(gstPercentage) || 0;
  if (base <= 0 || pct <= 0) return 0;
  return Math.round(base * (pct / 100) * 100) / 100;
};

export const calculateFinalTotalCost = (baseTotalCost, gstPercentage, gstCollected) => {
  const base = parseFloat(baseTotalCost) || 0;
  if (!gstCollected) return base > 0 ? Math.round(base * 100) / 100 : 0;
  const gstAmt = calculateGSTAmount(baseTotalCost, gstPercentage, gstCollected);
  return Math.round((base + gstAmt) * 100) / 100;
};

const FinalReportGST = ({
  gstCollected = false,
  gstCollectedDate = '',
  gstPercentage = 5,
  baseTotalCost = '0.00',
  onChange = () => {},
  errors = {},
  readOnly = false,
}) => {
  // Options for GST Collected dropdown
  const gstOptions = ['No', 'Yes'];

  // Options for GST Percentage dropdown (1% to 100%)
  const gstPercentageOptions = useMemo(() => {
    return Array.from({ length: 100 }, (_, i) => `${i + 1}%`);
  }, []);

  // Handle dropdown change (Yes / No)
  const handleCollectedChange = (e) => {
    const isYes = e.target.value === 'Yes';
    onChange({
      gst_collected: isYes,
      // If switching to Yes, keep current percentage if valid (>=1), otherwise default to 5
      gst_percentage: isYes ? (parseFloat(gstPercentage) >= 1 ? gstPercentage : 5) : 0,
      // Clear date if switching to No
      gst_collected_date: isYes ? gstCollectedDate : '',
      base_total_cost: baseTotalCost,
    });
  };

  // Handle generic inputs
  const handleFieldChange = (field, value) => {
    onChange({
      gst_collected: gstCollected,
      gst_collected_date: gstCollectedDate,
      gst_percentage: gstPercentage,
      base_total_cost: baseTotalCost,
      [field]: value,
    });
  };

  // Calculated values in real-time
  const calculatedGstAmount = useMemo(() => {
    return calculateGSTAmount(baseTotalCost, gstPercentage, gstCollected);
  }, [baseTotalCost, gstPercentage, gstCollected]);

  const calculatedFinalTotal = useMemo(() => {
    return calculateFinalTotalCost(baseTotalCost, gstPercentage, gstCollected);
  }, [baseTotalCost, gstPercentage, gstCollected]);

  // Read-only presentation mode
  if (readOnly) {
    return (
      <div className="gst-section-card">
        <div className="gst-header-banner">
          <div className="gst-title-wrap">
            <h2 className="gst-title">SECTION 5 – GST Details & Calculation</h2>
            <p className="gst-subtitle">Official tax calculation and final booking total.</p>
          </div>
          <span className={`gst-status-pill ${gstCollected ? 'pill-active' : 'pill-inactive'}`}>
            <span className="gst-status-dot"></span>
            <span>{gstCollected ? 'GST Collected: YES' : 'GST Collected: NO'}</span>
          </span>
        </div>

        <div className="gst-view-grid">
          <div className="gst-view-field">
            <span className="gst-view-label">GST Collected</span>
            <span className="gst-view-value">{gstCollected ? 'Yes' : 'No'}</span>
          </div>

          <div className="gst-view-field">
            <span className="gst-view-label">GST Collected Date</span>
            <span className="gst-view-value">
              {gstCollected && gstCollectedDate
                ? gstCollectedDate.split('-').reverse().join('/')
                : '-'}
            </span>
          </div>

          <div className="gst-view-field">
            <span className="gst-view-label">GST Percentage</span>
            <span className="gst-view-value">{gstCollected ? `${gstPercentage}%` : '0%'}</span>
          </div>

          <div className="gst-view-field">
            <span className="gst-view-label">Base Total Cost (Before GST)</span>
            <span className="gst-view-value">{formatINR(baseTotalCost)}</span>
          </div>

          <div className="gst-view-field">
            <span className="gst-view-label">GST Amount</span>
            <span className="gst-view-value">{formatINR(calculatedGstAmount)}</span>
          </div>

          <div className="gst-view-field">
            <span className="gst-view-label">Final Total Cost</span>
            <span className="gst-view-value final-highlight">{formatINR(calculatedFinalTotal)}</span>
          </div>
        </div>
      </div>
    );
  }

  // Editable Form Mode
  return (
    <div className="gst-section-card report-section-card" id="section-gst-details">
      <div className="gst-header-banner report-section-header">
        <div className="gst-title-wrap">
          <h2 className="gst-title report-section-heading">SECTION 5 – GST Details & Calculation</h2>
          <p className="gst-subtitle report-section-subheading">
            Enter GST details only if GST is collected. Otherwise, select No.
          </p>
        </div>
        <div className="report-section-actions">
          <span className={`gst-status-pill ${gstCollected ? 'pill-active' : 'pill-inactive'}`}>
            <span className="gst-status-dot"></span>
            <span>{gstCollected ? 'GST Active' : 'GST Exempt / Inactive'}</span>
          </span>
        </div>
      </div>

      <div className="gst-body">
        {/* Input Fields Grid: 2 columns on desktop */}
        <div className="gst-form-grid gst-fields-grid">
          {/* 1. GST Collected Dropdown */}
          <div className="gst-field-group">
            <label className="gst-field-label" htmlFor="gst_collected">
              GST Collected <span className="required-star">*</span>
            </label>
            <CustomDropdown
              id="gst_collected"
              name="gst_collected"
              value={gstCollected ? 'Yes' : 'No'}
              options={gstOptions}
              onChange={handleCollectedChange}
              required
            />
            <span className="gst-field-hint">Select Yes if GST tax is applicable to this tour.</span>
          </div>

          {/* 2. GST Collected Date */}
          <div className="gst-field-group">
            <label className="gst-field-label" htmlFor="gst_collected_date">
              GST Collected Date {gstCollected && <span className="required-star">*</span>}
            </label>
            <DatePicker
              id="gst_collected_date"
              name="gst_collected_date"
              value={gstCollected ? (gstCollectedDate || '') : ''}
              onChange={(e) => handleFieldChange('gst_collected_date', e.target.value)}
              disabled={!gstCollected}
              placeholder="DD/MM/YYYY"
              className={errors.gst_collected_date ? 'is-invalid' : ''}
              required={gstCollected}
            />
            {errors.gst_collected_date && (
              <span className="gst-error-msg">{errors.gst_collected_date}</span>
            )}
            <span className="gst-field-hint">Required only when GST is collected.</span>
          </div>

          {/* 3. Base Total Cost (Before GST) */}
          <div className="gst-field-group">
            <label className="gst-field-label" htmlFor="base_total_cost">
              Base Total Cost (Before GST) <span className="required-star">*</span>
            </label>
            <div className="gst-input-wrapper">
              <span className="gst-input-prefix">₹</span>
              <input
                type="number"
                id="base_total_cost"
                name="base_total_cost"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={baseTotalCost}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '' || parseFloat(val) >= 0) {
                    handleFieldChange('base_total_cost', val);
                  }
                }}
                className={`gst-input has-prefix ${errors.base_total_cost ? 'is-invalid' : ''}`}
                required
              />
            </div>
            {errors.base_total_cost && (
              <span className="gst-error-msg">{errors.base_total_cost}</span>
            )}
            <span className="gst-field-hint">Editable base booking amount before tax.</span>
          </div>

          {/* 4. GST Percentage (%) Dropdown */}
          <div className="gst-field-group">
            <label className="gst-field-label" htmlFor="gst_percentage">
              GST Percentage (%) {gstCollected && <span className="required-star">*</span>}
            </label>
            <CustomDropdown
              id="gst_percentage"
              name="gst_percentage"
              value={
                gstCollected && parseFloat(gstPercentage) >= 1 && parseFloat(gstPercentage) <= 100
                  ? `${Math.round(parseFloat(gstPercentage))}%`
                  : ''
              }
              options={gstPercentageOptions}
              onChange={(e) => {
                const selectedVal = e.target.value;
                if (!selectedVal) {
                  handleFieldChange('gst_percentage', 0);
                } else {
                  const num = parseInt(selectedVal.replace('%', ''), 10);
                  handleFieldChange('gst_percentage', isNaN(num) ? 0 : num);
                }
              }}
              placeholder="Select GST Percentage"
              disabled={!gstCollected}
              required={gstCollected}
              error={Boolean(errors.gst_percentage)}
            />
            {errors.gst_percentage && (
              <span className="gst-error-msg">{errors.gst_percentage}</span>
            )}
            <span className="gst-field-hint">Select tax rate from 1% to 100%.</span>
          </div>
        </div>

        {/* Structured Calculation Summary Area */}
        <div className="gst-calculation-summary" id="gst-calculation-summary-box">
          <div className="gst-calc-row">
            <span className="gst-calc-label">Base Total Cost</span>
            <span className="gst-calc-value">{formatINR(baseTotalCost)}</span>
          </div>

          <div className="gst-calc-row">
            <span className="gst-calc-label">
              GST Amount {gstCollected ? `(${gstPercentage || 0}%)` : '(Not applicable)'}
            </span>
            <span className="gst-calc-value">{formatINR(calculatedGstAmount)}</span>
          </div>

          <div className="gst-calc-row final-highlight">
            <span className="gst-calc-label">Final Total Cost with GST</span>
            <span className="gst-calc-value highlight-amount">{formatINR(calculatedFinalTotal)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinalReportGST;
