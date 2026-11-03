import React from 'react';
import { Plus, Trash2, ArrowUpRight } from 'lucide-react';
import DatePicker from './DatePicker';
import '../styles/PaymentSpent.css';

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
 * Formatter for two-digit S.No (01, 02, 03, etc.)
 */
export const formatSNo = (index) => {
  const num = index + 1;
  return num < 10 ? `0${num}` : `${num}`;
};

/**
 * Decimal-safe total spent amount calculation summing row amounts safely
 */
export const calculateTotalSpent = (rows = []) => {
  const totalPaise = rows.reduce((acc, row) => {
    const amt = parseFloat(row.amount) || 0;
    if (amt <= 0) return acc;
    return acc + Math.round(amt * 100);
  }, 0);
  return (totalPaise / 100).toFixed(2);
};

/**
 * Format ISO date (YYYY-MM-DD) to display format DD/MM/YYYY
 */
export const formatDateDisplay = (isoStr) => {
  if (!isoStr) return '-';
  const parts = isoStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return isoStr;
};

/**
 * Reusable PaymentSpent Component (Section 8)
 * Columns: S.No | Details | Date | Amount (₹) | Payment Mode | Actions
 */
const PaymentSpent = ({
  paymentsSpent = [],
  onChange,
  readOnly = false,
  errors = {},
}) => {
  // Add a new blank payment spent row
  const handleAddRow = () => {
    if (readOnly || !onChange) return;
    const newRow = {
      id: `temp_spent_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      details: '',
      payment_date: new Date().toISOString().split('T')[0],
      amount: '',
      payment_mode: '',
    };
    onChange([...paymentsSpent, newRow]);
  };

  // Remove a payment spent row
  const handleRemoveRow = (index) => {
    if (readOnly || !onChange) return;
    const updated = paymentsSpent.filter((_, i) => i !== index);
    onChange(updated);
  };

  // Handle cell field update
  const handleFieldChange = (index, field, value) => {
    if (readOnly || !onChange) return;
    const updated = paymentsSpent.map((row, i) => {
      if (i !== index) return row;
      let finalVal = value;
      if (field === 'amount') {
        // Prevent negative values and invalid characters
        if (value === '') {
          finalVal = '';
        } else {
          // Allow valid decimal representation up to 2 decimal places
          const cleaned = value.replace(/[^0-9.]/g, '');
          const parts = cleaned.split('.');
          if (parts.length > 2) {
            finalVal = `${parts[0]}.${parts.slice(1).join('')}`;
          } else if (parts.length === 2) {
            finalVal = `${parts[0]}.${parts[1].slice(0, 2)}`;
          } else {
            finalVal = cleaned;
          }
        }
      }
      return {
        ...row,
        [field]: finalVal,
      };
    });
    onChange(updated);
  };

  const totalSpent = calculateTotalSpent(paymentsSpent);

  return (
    <div className="payment-spent-section report-section-card" id="section-payment-spent">
      <div className="payment-spent-header-row report-section-header">
        <div className="payment-spent-header-titles">
          <h2 className="payment-spent-section-title report-section-heading">
            <ArrowUpRight size={18} color="#213B59" />
            <span>SECTION 8 – Payment Spent</span>
          </h2>
          <p className="payment-spent-section-subtitle report-section-subheading">
            Track all payments made to vendors, DMCs and service providers.
          </p>
        </div>

        {!readOnly && (
          <div className="report-section-actions">
            <button
              type="button"
              className="btn-add-spent"
              onClick={handleAddRow}
              id="btn-add-payment-spent"
            >
              <Plus size={16} />
              <span>Add Payment Spent</span>
            </button>
          </div>
        )}
      </div>

      <div className="payment-spent-table-wrapper report-table-wrapper">
        <table className="payment-spent-table report-table" id="payments-spent-table">
          <thead>
            <tr>
              <th className="th-sno">S.No</th>
              <th className="th-details">Details</th>
              <th className="th-date">Date</th>
              <th className="th-amount">Amount (₹)</th>
              <th className="th-mode">Payment Mode</th>
              {!readOnly && <th className="th-actions">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {paymentsSpent.length === 0 ? (
              <tr>
                <td
                  colSpan={readOnly ? 5 : 6}
                  className="payment-spent-empty-row"
                >
                  No payment spent entries recorded. {readOnly ? '' : 'Click "+ Add Payment Spent" above to add an entry.'}
                </td>
              </tr>
            ) : (
              paymentsSpent.map((row, index) => {
                const rowKey = row.id || `row_spent_${index}`;
                return (
                  <tr key={rowKey} className="payment-spent-row">
                    {/* S.No */}
                    <td style={{ textAlign: 'center' }}>
                      <span className="payment-spent-sno-badge">{formatSNo(index)}</span>
                    </td>

                    {/* Details */}
                    <td>
                      {readOnly ? (
                        <span>{row.details || '-'}</span>
                      ) : (
                        <input
                          type="text"
                          id={`spent-details-${index}`}
                          name={`spent_details_${index}`}
                          value={row.details || ''}
                          onChange={(e) => handleFieldChange(index, 'details', e.target.value)}
                          placeholder="e.g. Flight, LittleTown-DMC, VISA-Travel Berries"
                          className="payment-spent-input"
                        />
                      )}
                    </td>

                    {/* Date */}
                    <td>
                      {readOnly ? (
                        <span>{formatDateDisplay(row.payment_date)}</span>
                      ) : (
                        <DatePicker
                          name={`spent_payment_date_${index}`}
                          id={`spent-payment-date-${index}`}
                          value={row.payment_date || ''}
                          onChange={(e) => handleFieldChange(index, 'payment_date', e.target.value)}
                          placeholder="DD/MM/YYYY"
                          className="payment-spent-input"
                          required
                        />
                      )}
                    </td>

                    {/* Amount */}
                    <td>
                      {readOnly ? (
                        <div style={{ textAlign: 'right', fontWeight: 600 }}>
                          {formatINR(row.amount)}
                        </div>
                      ) : (
                        <div className="payment-spent-amount-wrapper">
                          <span className="payment-spent-amount-currency">₹</span>
                          <input
                            type="text"
                            inputMode="decimal"
                            id={`spent-amount-${index}`}
                            name={`spent_amount_${index}`}
                            value={row.amount}
                            onChange={(e) => handleFieldChange(index, 'amount', e.target.value)}
                            placeholder="0.00"
                            className="payment-spent-input payment-spent-amount-input"
                          />
                        </div>
                      )}
                    </td>

                    {/* Payment Mode */}
                    <td>
                      {readOnly ? (
                        <span>{row.payment_mode || '-'}</span>
                      ) : (
                        <input
                          type="text"
                          id={`spent-mode-${index}`}
                          name={`spent_payment_mode_${index}`}
                          value={row.payment_mode || ''}
                          onChange={(e) => handleFieldChange(index, 'payment_mode', e.target.value)}
                          placeholder="e.g. ICICI, HDFC, Gpay-Srikanth, Cash, UPI"
                          className="payment-spent-input"
                        />
                      )}
                    </td>

                    {/* Actions */}
                    {!readOnly && (
                      <td style={{ textAlign: 'center' }}>
                        <button
                          type="button"
                          className="btn-remove-spent"
                          onClick={() => handleRemoveRow(index)}
                          title="Remove Payment Spent Row"
                          id={`btn-remove-spent-${index}`}
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Premium Total Summary Area (Bottom Right) */}
      <div className="payment-spent-summary-panel report-total-summary">
        <span className="payment-spent-total-label report-total-summary-label">
          TOTAL SPENT AMOUNT
        </span>
        <span className="payment-spent-total-value report-total-summary-amount">
          {formatINR(totalSpent)}
        </span>
      </div>
    </div>
  );
};

export default PaymentSpent;
