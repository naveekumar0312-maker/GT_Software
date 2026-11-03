import React, { useMemo } from 'react';
import { formatINR } from './ServicesClient';
import '../styles/FinalFinancialSummary.css';

/**
 * Currency calculation helpers with decimal-safe integer paise arithmetic
 */
export const computeClientTotalCost = (clientServices = []) => {
  if (!Array.isArray(clientServices) || clientServices.length === 0) return 0;
  const totalPaise = clientServices.reduce((sum, row) => {
    const persons = parseInt(row.number_of_persons, 10) || 0;
    const price = parseFloat(row.price_per_person) || 0;
    const rowPaise = Math.round(persons * price * 100);
    return sum + rowPaise;
  }, 0);
  return totalPaise / 100;
};

export const computeDMCTotalExpense = (dmcServices = []) => {
  if (!Array.isArray(dmcServices) || dmcServices.length === 0) return 0;
  const totalPaise = dmcServices.reduce((sum, row) => {
    const persons = parseInt(row.number_of_persons, 10) || 0;
    const price = parseFloat(row.price_per_pax) || 0;
    const rowPaise = Math.round(persons * price * 100);
    return sum + rowPaise;
  }, 0);
  return totalPaise / 100;
};

export const computeTotalCostWithGST = (totalCost, gstAmount) => {
  const tc = parseFloat(totalCost) || 0;
  const gst = parseFloat(gstAmount) || 0;
  return Math.round((tc + gst) * 100) / 100;
};

export const computeNetProfit = (totalCostWithGST, totalExpense, processingFee) => {
  const tcGst = parseFloat(totalCostWithGST) || 0;
  const te = parseFloat(totalExpense) || 0;
  const pf = parseFloat(processingFee) || 0;
  return Math.round((tcGst - te - pf) * 100) / 100;
};

const FinalFinancialSummary = ({
  clientServices = [],
  dmcServices = [],
  gstAmount = 0,
  processingFee = '0.00',
  onProcessingFeeChange = () => {},
  readOnly = false,
  error = '',
  // Overrides for view mode if raw values are directly provided
  initialTotalCost = null,
  initialTotalExpense = null,
  initialTotalCostWithGST = null,
  initialNetProfit = null,
}) => {
  // 1. Total Cost from Client Services
  const totalCost = useMemo(() => {
    if (initialTotalCost !== null && initialTotalCost !== undefined) {
      return parseFloat(initialTotalCost) || 0;
    }
    return computeClientTotalCost(clientServices);
  }, [clientServices, initialTotalCost]);

  // 2. GST from Section 5
  const effectiveGstAmount = useMemo(() => {
    return parseFloat(gstAmount) || 0;
  }, [gstAmount]);

  // 3. Total Cost with GST = Total Cost + GST
  const totalCostWithGST = useMemo(() => {
    if (initialTotalCostWithGST !== null && initialTotalCostWithGST !== undefined) {
      return parseFloat(initialTotalCostWithGST) || 0;
    }
    return computeTotalCostWithGST(totalCost, effectiveGstAmount);
  }, [totalCost, effectiveGstAmount, initialTotalCostWithGST]);

  // 4. Processing Fee
  const effectiveProcessingFee = useMemo(() => {
    return parseFloat(processingFee) || 0;
  }, [processingFee]);

  // 5. Total Expense from Booking Services (DMC)
  const totalExpense = useMemo(() => {
    if (initialTotalExpense !== null && initialTotalExpense !== undefined) {
      return parseFloat(initialTotalExpense) || 0;
    }
    return computeDMCTotalExpense(dmcServices);
  }, [dmcServices, initialTotalExpense]);

  // 6. Net Profit = Total Cost with GST - Total Expense - Processing Fee
  const netProfit = useMemo(() => {
    if (initialNetProfit !== null && initialNetProfit !== undefined) {
      return parseFloat(initialNetProfit) || 0;
    }
    return computeNetProfit(totalCostWithGST, totalExpense, effectiveProcessingFee);
  }, [totalCostWithGST, totalExpense, effectiveProcessingFee, initialNetProfit]);

  // Profit Status indicator (Positive / Loss / Zero)
  const profitStatus = useMemo(() => {
    if (netProfit > 0) return 'profit';
    if (netProfit < 0) return 'loss';
    return 'zero';
  }, [netProfit]);

  return (
    <div className="financial-summary-card report-section-card" id="section-financial-summary">
      {/* Header Banner */}
      <div className="financial-header-banner report-section-header">
        <div className="financial-title-wrap">
          <h2 className="financial-title report-section-heading">SECTION 6 – Final Financial Summary</h2>
          <p className="financial-subtitle report-section-subheading">
            Comprehensive financial breakdown, processing fees, and management net profit.
          </p>
        </div>
        <div className="report-section-actions">
          <span className={`financial-profit-badge badge-${profitStatus}`}>
            <span className="financial-badge-dot"></span>
            <span>
              {profitStatus === 'profit'
                ? 'Profitable'
                : profitStatus === 'loss'
                ? 'Net Loss'
                : 'Break-Even'}
            </span>
          </span>
        </div>
      </div>

      {/* Exactly Six Rows in Ordered Arrangement */}
      <div className="financial-rows-container">
        {/* Row 1: Total Cost */}
        <div className="financial-summary-row">
          <div className="financial-row-label-wrap">
            <span className="financial-row-num">01</span>
            <div>
              <span className="financial-row-label">Total Cost</span>
              <span className="financial-row-hint">(Services - Client Grand Total)</span>
            </div>
          </div>
          <div className="financial-row-value-wrap">
            <span className="financial-row-value">{formatINR(totalCost)}</span>
          </div>
        </div>

        {/* Row 2: GST */}
        <div className="financial-summary-row">
          <div className="financial-row-label-wrap">
            <span className="financial-row-num">02</span>
            <div>
              <span className="financial-row-label">GST</span>
              <span className="financial-row-hint">(From GST Details Section)</span>
            </div>
          </div>
          <div className="financial-row-value-wrap">
            <span className="financial-row-value">{formatINR(effectiveGstAmount)}</span>
          </div>
        </div>

        {/* Row 3: Total Cost with GST (Highlighted) */}
        <div className="financial-summary-row row-cost-with-gst">
          <div className="financial-row-label-wrap">
            <span className="financial-row-num">03</span>
            <div>
              <span className="financial-row-label">Total Cost with GST</span>
              <span className="financial-row-hint">(Total Cost + GST)</span>
            </div>
          </div>
          <div className="financial-row-value-wrap">
            <span className="financial-row-value">{formatINR(totalCostWithGST)}</span>
          </div>
        </div>

        {/* Row 4: Processing Fee (Manual Entry / Read-only) */}
        <div className="financial-summary-row">
          <div className="financial-row-label-wrap">
            <span className="financial-row-num">04</span>
            <div>
              <span className="financial-row-label">Processing Fee</span>
              <span className="financial-row-hint">(Deducted from profit)</span>
            </div>
          </div>
          <div className="financial-row-value-wrap">
            {readOnly ? (
              <span className="financial-row-value">{formatINR(effectiveProcessingFee)}</span>
            ) : (
              <div className="financial-fee-wrapper">
                <span className="financial-fee-prefix">₹</span>
                <input
                  type="number"
                  id="processing_fee"
                  name="processing_fee"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={processingFee}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === '' || parseFloat(val) >= 0) {
                      onProcessingFeeChange(val);
                    }
                  }}
                  className={`financial-fee-input ${error ? 'is-invalid' : ''}`}
                />
              </div>
            )}
          </div>
        </div>

        {/* Row 5: Total Expense */}
        <div className="financial-summary-row">
          <div className="financial-row-label-wrap">
            <span className="financial-row-num">05</span>
            <div>
              <span className="financial-row-label">Total Expense</span>
              <span className="financial-row-hint">(Booking Services - DMC Grand Total)</span>
            </div>
          </div>
          <div className="financial-row-value-wrap">
            <span className="financial-row-value">{formatINR(totalExpense)}</span>
          </div>
        </div>

        {/* Row 6: Net Profit (Bold & Prominent) */}
        <div className={`financial-summary-row row-net-profit profit-${profitStatus}`}>
          <div className="financial-row-label-wrap">
            <span className="financial-row-num">06</span>
            <div>
              <span className="financial-row-label">Net Profit</span>
              <span className="financial-row-hint">
                (Total Cost with GST - Total Expense - Processing Fee)
              </span>
            </div>
          </div>
          <div className="financial-row-value-wrap">
            <span className="financial-row-value">
              {netProfit < 0 ? `- ₹${Math.abs(netProfit).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : formatINR(netProfit)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinalFinancialSummary;
