import React, { useMemo } from 'react';
import { Wallet, Building2, CheckCircle2, AlertTriangle, Scale } from 'lucide-react';
import '../styles/PaymentBalanceSummary.css';

/**
 * Currency formatter helper in INR (₹) with 2 decimal places
 */
export const formatINR = (val) => {
  const num = Number(val) || 0;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
};

/**
 * Format balance amount with sign awareness for negative values
 */
export const formatSignedBalance = (val) => {
  const num = Number(val) || 0;
  if (num < 0) {
    return `- ₹${Math.abs(num).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }
  return formatINR(num);
};

/**
 * Decimal-safe summation helper from paise
 */
const sumPaise = (items, getPaise) => {
  return items.reduce((acc, item) => acc + (getPaise(item) || 0), 0);
};

/**
 * Calculate client services total cost in paise
 */
export const computeClientTotalPaise = (clientServices = []) => {
  return sumPaise(clientServices, (cs) => {
    const persons = Math.max(0, parseInt(cs.number_of_persons, 10) || 0);
    const price = Math.max(0, parseFloat(cs.price_per_person) || 0);
    return Math.round(persons * Math.round(price * 100));
  });
};

/**
 * Calculate DMC services total expense in paise
 */
export const computeDMCTotalPaise = (dmcServices = []) => {
  return sumPaise(dmcServices, (ds) => {
    const persons = Math.max(0, parseInt(ds.number_of_persons, 10) || 0);
    const price = Math.max(0, parseFloat(ds.price_per_pax) || 0);
    return Math.round(persons * Math.round(price * 100));
  });
};

/**
 * Calculate Payment Collection total collected in paise
 */
export const computeCollectedPaise = (payments = []) => {
  return sumPaise(payments, (p) => {
    const amt = parseFloat(p.amount) || 0;
    return amt > 0 ? Math.round(amt * 100) : 0;
  });
};

/**
 * Calculate Payment Spent total paid in paise
 */
export const computeSpentPaise = (paymentsSpent = []) => {
  return sumPaise(paymentsSpent, (ps) => {
    const amt = parseFloat(ps.amount) || 0;
    return amt > 0 ? Math.round(amt * 100) : 0;
  });
};

/**
 * Reusable Section 9 – Payment Balance Summary Component
 * Displays:
 *   LEFT: Client Payment Balance (Total Client Amount, Total Collected, Yet to Receive)
 *   RIGHT: Supplier Payment Balance (Total to Supplier, Total Paid to Supplier, Yet to Supplier)
 */
const PaymentBalanceSummary = ({
  clientServices = [],
  dmcServices = [],
  payments = [],
  paymentsSpent = [],
  initialTotalCost,
  initialTotalExpense,
  initialTotalCollected,
  initialTotalSpent,
}) => {
  // 1. Client Balance Calculations
  const { totalClientAmount, totalCollected, yetToReceive } = useMemo(() => {
    let clientPaise = 0;
    if (clientServices && clientServices.length > 0) {
      clientPaise = computeClientTotalPaise(clientServices);
    } else if (initialTotalCost !== undefined && initialTotalCost !== null) {
      clientPaise = Math.round((parseFloat(initialTotalCost) || 0) * 100);
    }

    let collectedPaise = 0;
    if (payments && payments.length > 0) {
      collectedPaise = computeCollectedPaise(payments);
    } else if (initialTotalCollected !== undefined && initialTotalCollected !== null) {
      collectedPaise = Math.round((parseFloat(initialTotalCollected) || 0) * 100);
    }

    const diffPaise = clientPaise - collectedPaise;

    return {
      totalClientAmount: (clientPaise / 100).toFixed(2),
      totalCollected: (collectedPaise / 100).toFixed(2),
      yetToReceive: (diffPaise / 100).toFixed(2),
    };
  }, [clientServices, payments, initialTotalCost, initialTotalCollected]);

  // 2. Supplier Balance Calculations
  const { totalToSupplier, totalPaidToSupplier, yetToSupplier } = useMemo(() => {
    let supplierPaise = 0;
    if (dmcServices && dmcServices.length > 0) {
      supplierPaise = computeDMCTotalPaise(dmcServices);
    } else if (initialTotalExpense !== undefined && initialTotalExpense !== null) {
      supplierPaise = Math.round((parseFloat(initialTotalExpense) || 0) * 100);
    }

    let spentPaise = 0;
    if (paymentsSpent && paymentsSpent.length > 0) {
      spentPaise = computeSpentPaise(paymentsSpent);
    } else if (initialTotalSpent !== undefined && initialTotalSpent !== null) {
      spentPaise = Math.round((parseFloat(initialTotalSpent) || 0) * 100);
    }

    const diffPaise = supplierPaise - spentPaise;

    return {
      totalToSupplier: (supplierPaise / 100).toFixed(2),
      totalPaidToSupplier: (spentPaise / 100).toFixed(2),
      yetToSupplier: (diffPaise / 100).toFixed(2),
    };
  }, [dmcServices, paymentsSpent, initialTotalExpense, initialTotalSpent]);

  // Status badges determination
  const clientDiffNum = parseFloat(yetToReceive);
  let clientStatusBadge = { text: 'Pending Balance', class: 'badge-pending', state: 'state-pending' };
  if (clientDiffNum === 0) {
    clientStatusBadge = { text: 'Fully Settled', class: 'badge-settled', state: 'state-settled' };
  } else if (clientDiffNum < 0) {
    clientStatusBadge = { text: 'Excess Collected', class: 'badge-excess', state: 'state-excess' };
  }

  const supplierDiffNum = parseFloat(yetToSupplier);
  let supplierStatusBadge = { text: 'Pending Balance', class: 'badge-pending', state: 'state-pending' };
  if (supplierDiffNum === 0) {
    supplierStatusBadge = { text: 'Fully Settled', class: 'badge-settled', state: 'state-settled' };
  } else if (supplierDiffNum < 0) {
    supplierStatusBadge = { text: 'Overpaid to Supplier', class: 'badge-overpaid', state: 'state-overpaid' };
  }

  return (
    <div className="payment-balance-section report-section-card" id="section-payment-balance-summary">
      <div className="balance-section-header report-section-header">
        <div>
          <h2 className="balance-section-title report-section-heading">
            <Scale size={18} color="#213B59" />
            <span>SECTION 9 – Payment Balance Summary</span>
          </h2>
          <p className="balance-section-subtitle report-section-subheading">
            Real-time reconciliation of client receipts and vendor disbursements.
          </p>
        </div>
      </div>

      <div className="balance-panels-grid payment-balance-grid">
        {/* PANEL 1: Client Payment Balance */}
        <div className="balance-card client-balance-card" id="card-client-balance">
          <div className="balance-card-header">
            <div className="balance-card-title-group">
              <div className="balance-icon-circle icon-wallet">
                <Wallet size={18} />
              </div>
              <div>
                <h3 className="balance-card-title">Client Payment Balance</h3>
                <p className="balance-card-meta">Services (Client) vs Client Collections</p>
              </div>
            </div>
            <span className={`balance-badge ${clientStatusBadge.class}`}>
              {clientStatusBadge.text}
            </span>
          </div>

          <div className="balance-rows-list">
            <div className="balance-metric-row">
              <div className="metric-label-group">
                <span className="metric-label">Total Client Amount</span>
                <span className="metric-sub">Services (Client) Grand Total</span>
              </div>
              <span className="metric-val">{formatINR(totalClientAmount)}</span>
            </div>

            <div className="balance-metric-row">
              <div className="metric-label-group">
                <span className="metric-label">Total Collected</span>
                <span className="metric-sub">Sum of client payments received</span>
              </div>
              <span className="metric-val">{formatINR(totalCollected)}</span>
            </div>

            <div className={`balance-highlight-row ${clientStatusBadge.state}`}>
              <div className="metric-label-group">
                <span className="highlight-label-title">Yet to Receive</span>
                <span className="metric-sub" style={{ color: 'inherit', opacity: 0.8 }}>
                  Total Client Amount - Total Collected
                </span>
              </div>
              <span className="highlight-amount">
                {formatSignedBalance(yetToReceive)}
              </span>
            </div>
          </div>
        </div>

        {/* PANEL 2: Supplier Payment Balance */}
        <div className="balance-card supplier-balance-card" id="card-supplier-balance">
          <div className="balance-card-header">
            <div className="balance-card-title-group">
              <div className="balance-icon-circle icon-building">
                <Building2 size={18} />
              </div>
              <div>
                <h3 className="balance-card-title">Supplier Payment Balance</h3>
                <p className="balance-card-meta">Booking Services (DMC) vs Vendor Outflows</p>
              </div>
            </div>
            <span className={`balance-badge ${supplierStatusBadge.class}`}>
              {supplierStatusBadge.text}
            </span>
          </div>

          <div className="balance-rows-list">
            <div className="balance-metric-row">
              <div className="metric-label-group">
                <span className="metric-label">Total to Supplier</span>
                <span className="metric-sub">Booking Services (DMC) Grand Total</span>
              </div>
              <span className="metric-val">{formatINR(totalToSupplier)}</span>
            </div>

            <div className="balance-metric-row">
              <div className="metric-label-group">
                <span className="metric-label">Total Paid to Supplier</span>
                <span className="metric-sub">Sum of vendor payments spent</span>
              </div>
              <span className="metric-val">{formatINR(totalPaidToSupplier)}</span>
            </div>

            <div className={`balance-highlight-row ${supplierStatusBadge.state}`}>
              <div className="metric-label-group">
                <span className="highlight-label-title">Yet to Supplier</span>
                <span className="metric-sub" style={{ color: 'inherit', opacity: 0.8 }}>
                  Total to Supplier - Total Paid to Supplier
                </span>
              </div>
              <span className="highlight-amount">
                {formatSignedBalance(yetToSupplier)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentBalanceSummary;
