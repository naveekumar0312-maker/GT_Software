import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import '../styles/BookingServicesDMC.css';
import { formatINR } from './ServicesClient';

/**
 * Decimal-safe total calculation for DMC row
 */
export const calculateDMCRowTotal = (persons, price) => {
  const p = Math.max(0, parseInt(persons, 10) || 0);
  const pr = Math.max(0, parseFloat(price) || 0);
  const paise = Math.round(p * Math.round(pr * 100));
  return (paise / 100).toFixed(2);
};

/**
 * Decimal-safe Total DMC Cost calculation
 */
export const calculateTotalDMCCost = (rows = []) => {
  const totalPaise = rows.reduce((acc, row) => {
    const rowCost = parseFloat(row.total_payable || calculateDMCRowTotal(row.number_of_persons, row.price_per_pax)) || 0;
    return acc + Math.round(rowCost * 100);
  }, 0);
  return (totalPaise / 100).toFixed(2);
};

/**
 * Premium BookingServicesDMC Component
 * Columns: S.No | Service | Vendor | Contact No | No. of Persons | Price / Pax | Total Payable | Actions
 */
const BookingServicesDMC = ({
  dmcServices = [],
  onChange,
  readOnly = false,
}) => {
  // Add new blank DMC row
  const handleAddRow = () => {
    if (readOnly || !onChange) return;
    const newRow = {
      id: `new_dmc_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      service: '',
      vendor: '',
      contact_no: '',
      number_of_persons: 0,
      price_per_pax: '',
      total_payable: '0.00',
    };
    onChange([...dmcServices, newRow]);
  };

  // Remove row by id
  const handleRemoveRow = (idToRemove) => {
    if (readOnly || !onChange) return;
    const updated = dmcServices.filter((row) => row.id !== idToRemove);
    onChange(updated);
  };

  // Update row fields with automatic immediate recalculation
  const handleFieldChange = (id, field, value) => {
    if (readOnly || !onChange) return;

    const updated = dmcServices.map((row) => {
      if (row.id !== id) return row;

      const nextRow = { ...row, [field]: value };

      if (field === 'number_of_persons' || field === 'price_per_pax') {
        const persons = field === 'number_of_persons' ? value : row.number_of_persons;
        const price = field === 'price_per_pax' ? value : row.price_per_pax;
        nextRow.total_payable = calculateDMCRowTotal(persons, price);
      }

      return nextRow;
    });

    onChange(updated);
  };

  const totalDMCCost = calculateTotalDMCCost(dmcServices);

  return (
    <div className="dmc-services-section report-section-card" id="section-booking-services-dmc">
      {/* Header */}
      <div className="dmc-header-row report-section-header">
        <div className="dmc-header-titles">
          <h2 className="dmc-section-title report-section-heading">
            Booking Services (DMC)
          </h2>
          <p className="dmc-section-subtitle report-section-subheading">
            Manage vendor bookings and service costs
          </p>
        </div>
        {!readOnly && (
          <div className="report-section-actions">
            <button
              type="button"
              className="btn-add-dmc"
              onClick={handleAddRow}
              id="add-dmc-service-btn"
            >
              <Plus size={16} />
              <span>Add DMC Service</span>
            </button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="dmc-table-wrapper report-table-wrapper">
        <table className="dmc-table report-table">
          <thead>
            <tr>
              <th style={{ width: '6%', textAlign: 'center' }}>S.No</th>
              <th style={{ width: '23%' }}>Service</th>
              <th style={{ width: '21%' }}>Vendor</th>
              <th style={{ width: '16%' }}>Contact No</th>
              <th style={{ width: '10%', textAlign: 'center' }}>No. of Persons</th>
              <th style={{ width: '12%', textAlign: 'right' }}>Price / Pax (₹)</th>
              <th style={{ width: '12%', textAlign: 'right' }}>Total Payable (₹)</th>
              {!readOnly && <th style={{ width: '5%', textAlign: 'center' }}>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {dmcServices.length === 0 ? (
              <tr>
                <td colSpan={readOnly ? 7 : 8} className="dmc-empty-state">
                  <span>No DMC booking services added yet.</span>
                  {!readOnly && (
                    <div>
                      <button
                        type="button"
                        className="btn-empty-add-dmc"
                        onClick={handleAddRow}
                      >
                        <Plus size={14} />
                        <span>Add First DMC Service</span>
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ) : (
              dmcServices.map((row, index) => {
                const serialNumber = index + 1;
                const rowTotalVal = row.total_payable || calculateDMCRowTotal(row.number_of_persons, row.price_per_pax);

                if (readOnly) {
                  return (
                    <tr key={row.id}>
                      <td className="sno-cell">
                        <span className="sno-badge">{serialNumber}</span>
                      </td>
                      <td className="dmc-view-cell font-semibold">{row.service || '-'}</td>
                      <td className="dmc-view-cell font-semibold" style={{ color: '#0f2744' }}>{row.vendor || '-'}</td>
                      <td className="dmc-view-cell">{row.contact_no || '-'}</td>
                      <td className="dmc-view-cell text-center">{row.number_of_persons}</td>
                      <td className="dmc-view-cell text-right">{formatINR(row.price_per_pax)}</td>
                      <td className="dmc-view-cell text-right font-semibold" style={{ color: '#0f2744' }}>
                        {formatINR(rowTotalVal)}
                      </td>
                    </tr>
                  );
                }

                return (
                  <tr key={row.id}>
                    {/* S.No Badge */}
                    <td className="sno-cell">
                      <span className="sno-badge">{serialNumber}</span>
                    </td>

                    {/* Service */}
                    <td>
                      <input
                        type="text"
                        className="dmc-input"
                        placeholder="e.g. Flight, VISA, Land Packages"
                        value={row.service}
                        onChange={(e) => handleFieldChange(row.id, 'service', e.target.value)}
                        required
                      />
                    </td>

                    {/* Vendor */}
                    <td>
                      <input
                        type="text"
                        className="dmc-input"
                        placeholder="e.g. Tripjack, Travel Berries"
                        value={row.vendor}
                        onChange={(e) => handleFieldChange(row.id, 'vendor', e.target.value)}
                        required
                      />
                    </td>

                    {/* Contact No (text input supporting commas, &, leading zeros) */}
                    <td>
                      <input
                        type="text"
                        className="dmc-input"
                        placeholder="e.g. 0422-224411, +91 9876543210"
                        value={row.contact_no}
                        onChange={(e) => handleFieldChange(row.id, 'contact_no', e.target.value)}
                      />
                    </td>

                    {/* No. of Persons (whole number >= 0) */}
                    <td>
                      <input
                        type="number"
                        className="dmc-input text-center"
                        min="0"
                        step="1"
                        placeholder="0"
                        value={row.number_of_persons}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '');
                          handleFieldChange(row.id, 'number_of_persons', val === '' ? '' : parseInt(val, 10));
                        }}
                        required
                      />
                    </td>

                    {/* Price / Pax (decimal INR) */}
                    <td>
                      <input
                        type="number"
                        className="dmc-input text-right"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        value={row.price_per_pax}
                        onChange={(e) => handleFieldChange(row.id, 'price_per_pax', e.target.value)}
                        required
                      />
                    </td>

                    {/* Total Payable (Auto-calculated Read Only) */}
                    <td>
                      <input
                        type="text"
                        className="dmc-input dmc-input-readonly text-right"
                        value={formatINR(rowTotalVal)}
                        readOnly
                        tabIndex={-1}
                      />
                    </td>

                    {/* Remove Action */}
                    <td style={{ textAlign: 'center' }}>
                      <button
                        type="button"
                        className="btn-remove-dmc"
                        title="Remove DMC Service"
                        aria-label={`Remove DMC Service row ${serialNumber}`}
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

      {/* Premium Total Summary Area (Financial Dashboard Style) */}
      <div className="dmc-summary-panel report-total-summary">
        <span className="dmc-summary-label report-total-summary-label">
          TOTAL DMC COST
        </span>
        <span className="dmc-summary-amount report-total-summary-amount">
          {formatINR(totalDMCCost)}
        </span>
      </div>
    </div>
  );
};

export default BookingServicesDMC;
