import React from 'react';
import { Plus, Trash2, CreditCard } from 'lucide-react';
import DatePicker from './DatePicker';
import '../styles/PaymentCollection.css';

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
 * Decimal-safe total collected amount calculation summing row amounts safely
 */
export const calculateTotalCollected = (rows = []) => {
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
 * Reusable PaymentCollection Component (Section 7)
 * Columns: S.No | Date | Amount (₹) | Payment Mode | Actions
 */
const PaymentCollection = ({
  payments = [],
  onChange,
  readOnly = false,
  errors = {},
}) => {
  // Add a new blank payment row
  const handleAddRow = () => {
    if (readOnly || !onChange) return;
    const newRow = {
      id: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      payment_date: new Date().toISOString().split('T')[0],
      amount: '',
      payment_mode: '',
    };
    onChange([...payments, newRow]);
  };

  // Remove a payment row
  const handleRemoveRow = (index) => {
    if (readOnly || !onChange) return;
    const updated = payments.filter((_, i) => i !== index);
    onChange(updated);
  };

  // Handle cell field update
  const handleFieldChange = (index, field, value) => {
    if (readOnly || !onChange) return;
    const updated = payments.map((row, i) => {
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

  const totalCollected = calculateTotalCollected(payments);

  return (
    <div className="payment-collection-section report-section-card" id="section-payment-collection">
      <div className="payment-header-row report-section-header">
        <div className="payment-header-titles">
          <h2 className="payment-section-title report-section-heading">
            <CreditCard size={18} color="#213B59" />
            <span>SECTION 7 – Payment Collection</span>
          </h2>
          <p className="payment-section-subtitle report-section-subheading">
            Track all payments received from the client.
          </p>
        </div>

        {!readOnly && (
          <div className="report-section-actions">
            <button
              type="button"
              className="btn-add-payment"
              onClick={handleAddRow}
              id="btn-add-payment"
            >
              <Plus size={16} />
              <span>Add Payment</span>
            </button>
          </div>
        )}
      </div>

      <div className="payment-table-wrapper report-table-wrapper">
        <table className="payment-table report-table" id="payments-table">
          <thead>
            <tr>
              <th className="th-sno">S.No</th>
              <th className="th-date">Date</th>
              <th className="th-amount">Amount (₹)</th>
              <th className="th-mode">Payment Mode</th>
              {!readOnly && <th className="th-actions">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {payments.length === 0 ? (
              <tr>
                <td
                  colSpan={readOnly ? 4 : 5}
                  className="payment-empty-row"
                >
                  No payments recorded. {readOnly ? '' : 'Click "+ Add Payment" above to add a payment.'}
                </td>
              </tr>
            ) : (
              payments.map((row, index) => {
                const rowKey = row.id || `row_${index}`;
                return (
                  <tr key={rowKey} className="payment-row">
                    {/* S.No */}
                    <td style={{ textAlign: 'center' }}>
                      <span className="payment-sno-badge">{formatSNo(index)}</span>
                    </td>

                    {/* Date */}
                    <td>
                      {readOnly ? (
                        <span>{formatDateDisplay(row.payment_date)}</span>
                      ) : (
                        <DatePicker
                          name={`payment_date_${index}`}
                          id={`payment-date-${index}`}
                          value={row.payment_date || ''}
                          onChange={(e) => handleFieldChange(index, 'payment_date', e.target.value)}
                          placeholder="DD/MM/YYYY"
                          className="payment-input"
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
                        <div className="payment-amount-wrapper">
                          <span className="payment-amount-currency">₹</span>
                          <input
                            type="text"
                            inputMode="decimal"
                            id={`payment-amount-${index}`}
                            name={`payment_amount_${index}`}
                            value={row.amount}
                            onChange={(e) => handleFieldChange(index, 'amount', e.target.value)}
                            placeholder="0.00"
                            className="payment-input payment-amount-input"
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
                          id={`payment-mode-${index}`}
                          name={`payment_mode_${index}`}
                          value={row.payment_mode || ''}
                          onChange={(e) => handleFieldChange(index, 'payment_mode', e.target.value)}
                          placeholder="e.g. ICICI, HDFC, Gpay-Ammu, Cash, UPI"
                          className="payment-input"
                        />
                      )}
                    </td>

                    {/* Actions */}
                    {!readOnly && (
                      <td style={{ textAlign: 'center' }}>
                        <button
                          type="button"
                          className="btn-remove-payment-row btn-remove-payment"
                          onClick={() => handleRemoveRow(index)}
                          title="Remove Payment Row"
                          id={`btn-remove-payment-${index}`}
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
      <div className="payment-summary-panel report-total-summary">
        <span className="payment-total-label report-total-summary-label">
          TOTAL COLLECTED AMOUNT
        </span>
        <span className="payment-total-value report-total-summary-amount">
          {formatINR(totalCollected)}
        </span>
      </div>
    </div>
  );
};

export default PaymentCollection;
