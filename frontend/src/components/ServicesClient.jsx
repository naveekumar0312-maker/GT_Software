import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import '../styles/ServicesClient.css';

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
 * Decimal-safe total cost calculation avoiding floating-point precision errors
 */
export const calculateRowTotal = (persons, price) => {
  const p = Math.max(0, parseInt(persons, 10) || 0);
  const pr = Math.max(0, parseFloat(price) || 0);
  // Integer paise calculation: round to nearest paisa
  const paise = Math.round(p * Math.round(pr * 100));
  return (paise / 100).toFixed(2);
};

/**
 * Calculate Grand Total Cost summing row totals safely
 */
export const calculateGrandTotal = (rows = []) => {
  const totalPaise = rows.reduce((acc, row) => {
    const rowCost = parseFloat(row.total_cost || calculateRowTotal(row.number_of_persons, row.price_per_person)) || 0;
    return acc + Math.round(rowCost * 100);
  }, 0);
  return (totalPaise / 100).toFixed(2);
};

/**
 * Reusable ServicesClient Component
 * Columns: S.No | Service | No. of Persons | Price / Person | Total Cost | Remarks | Actions
 */
const ServicesClient = ({
  services = [],
  onChange,
  readOnly = false,
}) => {
  // Add a new blank service row
  const handleAddRow = () => {
    if (readOnly || !onChange) return;
    const newRow = {
      id: `new_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      service: '',
      number_of_persons: 1,
      price_per_person: '',
      total_cost: '0.00',
      remarks: '',
    };
    onChange([...services, newRow]);
  };

  // Remove a row by id
  const handleRemoveRow = (idToRemove) => {
    if (readOnly || !onChange) return;
    const updated = services.filter((row) => row.id !== idToRemove);
    onChange(updated);
  };

  // Handle cell edits with immediate recalculation
  const handleFieldChange = (id, field, value) => {
    if (readOnly || !onChange) return;

    const updated = services.map((row) => {
      if (row.id !== id) return row;

      const nextRow = { ...row, [field]: value };

      if (field === 'number_of_persons' || field === 'price_per_person') {
        const persons = field === 'number_of_persons' ? value : row.number_of_persons;
        const price = field === 'price_per_person' ? value : row.price_per_person;
        nextRow.total_cost = calculateRowTotal(persons, price);
      }

      return nextRow;
    });

    onChange(updated);
  };

  const grandTotal = calculateGrandTotal(services);

  return (
    <div className="services-client-section report-section-card" id="section-services-client">
      {/* Header */}
      <div className="services-header-row report-section-header">
        <div className="services-header-titles">
          <h2 className="services-section-title report-section-heading">
            Services (Client)
          </h2>
          <p className="services-section-subtitle report-section-subheading">
            Manage client tour services and package costs
          </p>
        </div>
        {!readOnly && (
          <div className="report-section-actions">
            <button
              type="button"
              className="btn-add-service"
              onClick={handleAddRow}
              id="add-service-btn"
            >
              <Plus size={16} />
              <span>Add Service</span>
            </button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="services-table-wrapper report-table-wrapper">
        <table className="services-table report-table">
          <thead>
            <tr>
              <th style={{ width: '6%', textAlign: 'center' }}>S.No</th>
              <th style={{ width: '30%' }}>Service</th>
              <th style={{ width: '12%', textAlign: 'center' }}>No. of Persons</th>
              <th style={{ width: '15%', textAlign: 'right' }}>Price / Person (₹)</th>
              <th style={{ width: '15%', textAlign: 'right' }}>Total Cost (₹)</th>
              <th style={{ width: readOnly ? '22%' : '17%' }}>Remarks</th>
              {!readOnly && <th style={{ width: '5%', textAlign: 'center' }}>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {services.length === 0 ? (
              <tr>
                <td colSpan={readOnly ? 6 : 7} className="services-empty-state">
                  <span>No client services added yet.</span>
                  {!readOnly && (
                    <div>
                      <button
                        type="button"
                        className="btn-empty-add"
                        onClick={handleAddRow}
                      >
                        <Plus size={14} />
                        <span>Add First Service</span>
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ) : (
              services.map((row, index) => {
                const serialBadgeText = formatSNo(index);
                const totalCostVal = row.total_cost || calculateRowTotal(row.number_of_persons, row.price_per_person);

                if (readOnly) {
                  return (
                    <tr key={row.id}>
                      <td className="srv-sno-cell">
                        <span className="srv-sno-badge">{serialBadgeText}</span>
                      </td>
                      <td className="service-view-cell font-semibold">{row.service || '-'}</td>
                      <td className="service-view-cell text-center">{row.number_of_persons}</td>
                      <td className="service-view-cell text-right">{formatINR(row.price_per_person)}</td>
                      <td className="service-view-cell text-right font-semibold" style={{ color: '#0f2744' }}>
                        {formatINR(totalCostVal)}
                      </td>
                      <td className="service-view-cell">{row.remarks || '-'}</td>
                    </tr>
                  );
                }

                return (
                  <tr key={row.id}>
                    {/* S.No Badge (01, 02, ...) */}
                    <td className="srv-sno-cell">
                      <span className="srv-sno-badge">{serialBadgeText}</span>
                    </td>

                    {/* Service */}
                    <td>
                      <input
                        type="text"
                        className="service-input"
                        placeholder="e.g. Flight - CJB to BKK, Singapore VISA"
                        value={row.service}
                        onChange={(e) => handleFieldChange(row.id, 'service', e.target.value)}
                        required
                      />
                    </td>

                    {/* No. of Persons (whole numbers >= 0) */}
                    <td>
                      <input
                        type="number"
                        className="service-input text-center"
                        min="0"
                        step="1"
                        placeholder="1"
                        value={row.number_of_persons}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '');
                          handleFieldChange(row.id, 'number_of_persons', val === '' ? '' : parseInt(val, 10));
                        }}
                        required
                      />
                    </td>

                    {/* Price / Person (decimal INR) */}
                    <td>
                      <input
                        type="number"
                        className="service-input text-right"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        value={row.price_per_person}
                        onChange={(e) => handleFieldChange(row.id, 'price_per_person', e.target.value)}
                        required
                      />
                    </td>

                    {/* Total Cost (Auto Calculated Read Only) */}
                    <td>
                      <input
                        type="text"
                        className="service-input service-input-readonly text-right"
                        value={formatINR(totalCostVal)}
                        readOnly
                        tabIndex={-1}
                      />
                    </td>

                    {/* Remarks */}
                    <td>
                      <input
                        type="text"
                        className="service-input"
                        placeholder="Optional remarks"
                        value={row.remarks}
                        onChange={(e) => handleFieldChange(row.id, 'remarks', e.target.value)}
                      />
                    </td>

                    {/* Remove Action */}
                    <td style={{ textAlign: 'center' }}>
                      <button
                        type="button"
                        className="btn-remove-service"
                        title="Remove Service"
                        aria-label={`Remove Service row ${serialBadgeText}`}
                        onClick={() => handleRemoveRow(row.id)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Premium Total Summary Area (Matching DMC Financial Dashboard Style) */}
      <div className="services-summary-panel report-total-summary">
        <span className="services-summary-label report-total-summary-label">
          GRAND TOTAL COST
        </span>
        <span className="services-summary-amount report-total-summary-amount">
          {formatINR(grandTotal)}
        </span>
      </div>
    </div>
  );
};

export default ServicesClient;
