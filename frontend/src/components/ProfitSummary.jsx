import React, { useMemo } from 'react';
import '../styles/ProfitSummary.css';
import { formatINR, calculateGrandTotal } from './ServicesClient';
import { calculateTotalDMCCost } from './BookingServicesDMC';

/**
 * Decimal-safe difference calculation (Total Cost - Total Expense)
 */
export const calculateApproxProfit = (totalCost, totalExpense) => {
  const costPaise = Math.round((parseFloat(totalCost) || 0) * 100);
  const expensePaise = Math.round((parseFloat(totalExpense) || 0) * 100);
  const profitPaise = costPaise - expensePaise;
  return (profitPaise / 100).toFixed(2);
};

/**
 * Reusable ProfitSummary Component
 * Displays: Total Cost, Total Expense, Approx Profit
 */
const ProfitSummary = ({
  clientServices = [],
  dmcServices = [],
  // Optional pre-calculated overrides (for view mode if backend provided)
  initialTotalCost,
  initialTotalExpense,
  initialApproxProfit,
}) => {
  // Real-time calculation from clientServices and dmcServices
  const totalCost = useMemo(() => {
    if (initialTotalCost !== undefined && (!clientServices || clientServices.length === 0)) {
      return parseFloat(initialTotalCost || 0).toFixed(2);
    }
    return calculateGrandTotal(clientServices);
  }, [clientServices, initialTotalCost]);

  const totalExpense = useMemo(() => {
    if (initialTotalExpense !== undefined && (!dmcServices || dmcServices.length === 0)) {
      return parseFloat(initialTotalExpense || 0).toFixed(2);
    }
    return calculateTotalDMCCost(dmcServices);
  }, [dmcServices, initialTotalExpense]);

  const approxProfit = useMemo(() => {
    return calculateApproxProfit(totalCost, totalExpense);
  }, [totalCost, totalExpense]);

  const profitNum = parseFloat(approxProfit) || 0;
  const profitStatusClass = profitNum > 0 ? 'profit-positive' : profitNum < 0 ? 'profit-negative' : 'profit-zero';

  return (
    <div className="profit-summary-section">
      <div className="profit-summary-header">
        <h2 className="profit-summary-title">Profit Summary</h2>
        <span className="profit-summary-subtitle">
          Real-time financial summary calculated from Client Services and DMC Bookings
        </span>
      </div>

      <div className="profit-metrics-grid">
        {/* Metric 1: Total Cost */}
        <div className="profit-metric-card card-cost">
          <span className="profit-metric-label">1. Total Cost</span>
          <span className="profit-metric-subtext">Sum of all Client Services</span>
          <span className="profit-metric-value">{formatINR(totalCost)}</span>
        </div>

        {/* Metric 2: Total Expense */}
        <div className="profit-metric-card card-expense">
          <span className="profit-metric-label">2. Total Expense</span>
          <span className="profit-metric-subtext">Sum of all DMC Bookings</span>
          <span className="profit-metric-value">{formatINR(totalExpense)}</span>
        </div>

        {/* Metric 3: Approx Profit */}
        <div className={`profit-metric-card card-profit ${profitStatusClass}`}>
          <span className="profit-metric-label">3. Approx Profit</span>
          <span className="profit-metric-subtext">Total Cost – Total Expense</span>
          <span className="profit-metric-value">{formatINR(approxProfit)}</span>
        </div>
      </div>
    </div>
  );
};

export default ProfitSummary;
