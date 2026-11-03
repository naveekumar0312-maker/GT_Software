import React, { useState, useEffect } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Edit3, Printer, AlertCircle } from 'lucide-react';
import { finalReportService } from '../services/finalReportApi';
import ServicesClient, { formatINR, calculateGrandTotal } from '../components/ServicesClient';
import BookingServicesDMC, { calculateTotalDMCCost } from '../components/BookingServicesDMC';
import FinalReportGST from '../components/FinalReportGST';
import FinalFinancialSummary from '../components/FinalFinancialSummary';
import PaymentCollection, { calculateTotalCollected } from '../components/PaymentCollection';
import PaymentSpent, { calculateTotalSpent } from '../components/PaymentSpent';
import PaymentBalanceSummary, { formatSignedBalance } from '../components/PaymentBalanceSummary';
import DownloadPDFButton from '../components/DownloadPDFButton';
import '../styles/FirstReportView.css';
import '../styles/FirstReportPrint.css';

const FinalReportView = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const shouldAutoPrint = searchParams.get('print') === 'true';

  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch report details
  useEffect(() => {
    const fetchReport = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await finalReportService.getById(id);
        const record = data.data || data;
        setReport(record);
      } catch (err) {
        console.error('Error fetching final report:', err);
        setError('Failed to load final report from server. Please verify the ID.');
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [id]);

  // Handle auto-print if triggered with ?print=true
  useEffect(() => {
    if (!loading && report && shouldAutoPrint) {
      const timer = setTimeout(() => {
        window.print();
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [loading, report, shouldAutoPrint]);

  // Format date helper DD/MM/YYYY
  const formatDate = (isoString) => {
    if (!isoString) return '-';
    const parts = String(isoString).split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return isoString;
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="first-report-view-page">
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div className="loading-spinner" style={{ margin: '0 auto 16px' }}></div>
          <h3>Loading Final Report Details...</h3>
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="first-report-view-page">
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div className="state-icon-wrapper" style={{ color: '#dc2626', margin: '0 auto 16px' }}>
            <AlertCircle size={32} />
          </div>
          <h3>Final Report Not Found</h3>
          <p style={{ color: 'var(--muted-text)', marginBottom: '20px' }}>{error}</p>
          <Link to="/final-report" className="btn-view-action btn-view-back">
            <ArrowLeft size={16} />
            <span>Back to Final Reports</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* ========================================================= */}
      {/* On-Screen Professional View UI                            */}
      {/* ========================================================= */}
      <div className="first-report-view-page">
        {/* Header Bar */}
        <div className="view-page-header">
          <Link to="/final-report" className="back-nav-link" id="view-back-to-list-link">
            <ArrowLeft size={16} />
            <span>Back</span>
          </Link>

          <div className="view-header-bar">
            <div className="view-header-left">
              <span className="crm-pill-large">CRM ID: {report.crm_id}</span>
              <div className="view-title-wrap">
                <h1>{report.guest_name}</h1>
                <p>
                  {report.destination} • {report.tour_type} Tour ({report.branch} Branch)
                </p>
              </div>
            </div>

            <div className="view-actions-right">
              <Link to="/final-report" className="btn-view-action btn-view-back">
                <ArrowLeft size={16} />
                <span>Back</span>
              </Link>

              <Link
                to={`/final-report/${report.id}/edit`}
                className="btn-view-action btn-view-edit"
                id="view-edit-btn"
              >
                <Edit3 size={16} />
                <span>Edit Final Report</span>
              </Link>

              <button
                type="button"
                className="btn-view-action btn-view-print"
                onClick={handlePrint}
                id="view-print-btn"
              >
                <Printer size={16} />
                <span>Print Report</span>
              </button>

              <DownloadPDFButton
                reportType="final"
                reportId={report.id}
                crmId={report.crm_id}
                id="view-download-pdf-btn"
              >
                Download PDF
              </DownloadPDFButton>
            </div>
          </div>
        </div>

        {/* Saved Data Display in Exactly Six Sections */}
        <div className="view-sections-container">
          
          {/* Section 1 – Tour Confirmation Details */}
          <div className="view-card">
            <h2 className="view-card-title">SECTION 1 – Tour Confirmation Details</h2>
            <div className="view-grid-3">
              <div className="view-data-field">
                <span className="field-label">Report / Booking Date</span>
                <span className="field-value">{formatDate(report.report_date)}</span>
              </div>

              <div className="view-data-field">
                <span className="field-label">Date of Travel</span>
                <span className="field-value">{formatDate(report.travel_date)}</span>
              </div>

              <div className="view-data-field">
                <span className="field-label">Tour Type</span>
                <span className="field-value">{report.tour_type}</span>
              </div>

              <div className="view-data-field">
                <span className="field-label">CRM ID</span>
                <span className="field-value highlight-box">{report.crm_id}</span>
              </div>

              <div className="view-data-field">
                <span className="field-label">Sales By</span>
                <span className="field-value">{report.sales_by}</span>
              </div>

              <div className="view-data-field">
                <span className="field-label">Branch</span>
                <span className="field-value">{report.branch}</span>
              </div>
            </div>
          </div>

          {/* Section 2 – Guest & Tour Details */}
          <div className="view-card">
            <h2 className="view-card-title">SECTION 2 – Guest & Tour Details</h2>
            <div className="view-grid-3">
              
              {/* Left Column: Personal Contact */}
              <div className="view-column">
                <div className="view-data-field">
                  <span className="field-label">Guest Name</span>
                  <span className="field-value">{report.guest_name}</span>
                </div>
                <div className="view-data-field">
                  <span className="field-label">Mobile Number</span>
                  <span className="field-value">{report.mobile_no}</span>
                </div>
                <div className="view-data-field">
                  <span className="field-label">Date of Birth (DOB)</span>
                  <span className="field-value">{formatDate(report.dob)}</span>
                </div>
                <div className="view-data-field">
                  <span className="field-label">Email ID</span>
                  <span className="field-value">{report.email_id || '-'}</span>
                </div>
              </div>

              {/* Middle Column: Passenger Counts */}
              <div className="view-column">
                <div className="view-data-field">
                  <span className="field-label">Adults</span>
                  <span className="field-value">{report.adults}</span>
                </div>
                <div className="view-data-field">
                  <span className="field-label">Child</span>
                  <span className="field-value">{report.child}</span>
                </div>
                <div className="view-data-field">
                  <span className="field-label">Total Pax</span>
                  <span className="field-value highlight-box">{report.total_pax} Passengers</span>
                </div>
              </div>

              {/* Right Column: Travel Specs */}
              <div className="view-column">
                <div className="view-data-field">
                  <span className="field-label">Client Type</span>
                  <span className="field-value">{report.client_type}</span>
                </div>
                <div className="view-data-field">
                  <span className="field-label">Destination</span>
                  <span className="field-value">{report.destination}</span>
                </div>
                <div className="view-data-field">
                  <span className="field-label">Duration</span>
                  <span className="field-value">{report.duration} Days</span>
                </div>
                <div className="view-data-field">
                  <span className="field-label">Rooms</span>
                  <span className="field-value">{report.rooms} Room(s)</span>
                </div>
              </div>

            </div>
          </div>

          {/* Section 3 – Services (Client) */}
          <ServicesClient
            services={report.client_services || []}
            readOnly={true}
          />

          {/* Section 4 – Booking Services (DMC) */}
          <BookingServicesDMC
            dmcServices={report.dmc_services || []}
            readOnly={true}
          />

          {/* Section 5 – GST Details & Calculation */}
          <FinalReportGST
            gstCollected={report.gst_collected}
            gstCollectedDate={report.gst_collected_date}
            gstPercentage={report.gst_percentage}
            baseTotalCost={report.base_total_cost}
            readOnly={true}
          />

          {/* Section 6 – Final Financial Summary & Net Profit */}
          <FinalFinancialSummary
            clientServices={report.client_services || []}
            dmcServices={report.dmc_services || []}
            gstAmount={report.gst_amount}
            processingFee={report.processing_fee}
            readOnly={true}
            initialTotalCost={report.total_cost}
            initialTotalExpense={report.total_expense}
            initialTotalCostWithGST={report.total_cost_with_gst}
            initialNetProfit={report.net_profit}
          />

          {/* Section 7 – Payment Collection */}
          <PaymentCollection
            payments={report.payments || []}
            readOnly={true}
          />

          {/* Section 8 – Payment Spent */}
          <PaymentSpent
            paymentsSpent={report.payments_spent || []}
            readOnly={true}
          />

          {/* Section 9 – Payment Balance Summary */}
          <PaymentBalanceSummary
            clientServices={report.client_services || []}
            dmcServices={report.dmc_services || []}
            payments={report.payments || []}
            paymentsSpent={report.payments_spent || []}
            initialTotalCost={report.total_cost}
            initialTotalExpense={report.total_expense}
            initialTotalCollected={report.total_collected_amount}
            initialTotalSpent={report.total_spent_amount}
          />

          {/* Clean On-Screen Signature Block */}
          <div className="view-signatures-card">
            <div className="view-signatures-grid">
              <div className="view-signature-item">
                <div className="view-signature-line"></div>
                <span className="view-signature-label">Prepared By</span>
                <span className="view-signature-subtext">{report.sales_by || 'Sales Executive'}</span>
              </div>
              <div className="view-signature-item">
                <div className="view-signature-line"></div>
                <span className="view-signature-label">Verified By</span>
                <span className="view-signature-subtext">Operations / Accounts</span>
              </div>
              <div className="view-signature-item">
                <div className="view-signature-line"></div>
                <span className="view-signature-label">Authorized Signature</span>
                <span className="view-signature-subtext">Branch Manager / Director</span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ========================================================= */}
      {/* Professional A4 Print Sheet Document (Print Only)         */}
      {/* ========================================================= */}
      <div className="print-only-container">
        <div className="print-document">
          <header className="print-header">
          <div className="print-brand">
            <h1>ASPIRE TOUR ERP</h1>
            <p>Tourism India Pvt Ltd • Official Tour Confirmation Sheet</p>
          </div>
          <div className="print-meta">
            <h2>FINAL CONFIRMATION REPORT</h2>
            <div className="print-badge-crm">CRM ID: #{report.crm_id}</div>
            <div className="print-generated">Printed: {new Date().toLocaleDateString('en-GB')}</div>
          </div>
        </header>

        <section className="print-section">
          <div className="print-section-title">1. Tour Confirmation Details</div>
          <div className="print-grid-3">
            <div className="print-row"><span className="print-lbl">Report Date:</span><span className="print-val">{formatDate(report.report_date)}</span></div>
            <div className="print-row"><span className="print-lbl">Travel Date:</span><span className="print-val">{formatDate(report.travel_date)}</span></div>
            <div className="print-row"><span className="print-lbl">Tour Type:</span><span className="print-val">{report.tour_type}</span></div>
            <div className="print-row"><span className="print-lbl">CRM ID:</span><span className="print-val font-bold">{report.crm_id}</span></div>
            <div className="print-row"><span className="print-lbl">Sales By:</span><span className="print-val">{report.sales_by}</span></div>
            <div className="print-row"><span className="print-lbl">Branch:</span><span className="print-val">{report.branch}</span></div>
          </div>
        </section>

        <section className="print-section">
          <div className="print-section-title">2. Guest & Tour Details</div>
          <div className="print-grid-3">
            <div className="print-row"><span className="print-lbl">Guest Name:</span><span className="print-val font-bold">{report.guest_name}</span></div>
            <div className="print-row"><span className="print-lbl">Mobile No:</span><span className="print-val">{report.mobile_no}</span></div>
            <div className="print-row"><span className="print-lbl">DOB:</span><span className="print-val">{formatDate(report.dob)}</span></div>
            <div className="print-row"><span className="print-lbl">Email ID:</span><span className="print-val">{report.email_id || '-'}</span></div>
            <div className="print-row"><span className="print-lbl">Adults:</span><span className="print-val">{report.adults}</span></div>
            <div className="print-row"><span className="print-lbl">Child:</span><span className="print-val">{report.child}</span></div>
            <div className="print-row"><span className="print-lbl">Total Pax:</span><span className="print-val font-bold">{report.total_pax}</span></div>
            <div className="print-row"><span className="print-lbl">Client Type:</span><span className="print-val">{report.client_type}</span></div>
            <div className="print-row"><span className="print-lbl">Destination:</span><span className="print-val font-bold">{report.destination}</span></div>
            <div className="print-row"><span className="print-lbl">Duration:</span><span className="print-val">{report.duration} Days</span></div>
            <div className="print-row"><span className="print-lbl">Rooms:</span><span className="print-val">{report.rooms} Room(s)</span></div>
          </div>
        </section>

        {/* Section 3 Print Table - Services (Client) */}
        <section className="print-section">
          <div className="print-section-title">3. Services (Client)</div>
          <table className="print-table">
            <thead>
              <tr style={{ background: '#f1f5f9', color: '#1e293b' }}>
                <th style={{ width: '8%', textAlign: 'center', fontWeight: 'bold' }}>S.No</th>
                <th style={{ width: '32%', textAlign: 'left', fontWeight: 'bold' }}>Service</th>
                <th style={{ width: '14%', textAlign: 'center', fontWeight: 'bold' }}>No. of Persons</th>
                <th style={{ width: '16%', textAlign: 'right', fontWeight: 'bold' }}>Price / Person</th>
                <th style={{ width: '16%', textAlign: 'right', fontWeight: 'bold' }}>Total Cost</th>
                <th style={{ width: '14%', textAlign: 'left', fontWeight: 'bold' }}>Remarks</th>
              </tr>
            </thead>
            <tbody>
              {(!report.client_services || report.client_services.length === 0) ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '10px', color: '#64748b' }}>
                    No client services recorded.
                  </td>
                </tr>
              ) : (
                report.client_services.map((cs, idx) => {
                  const sNoStr = (idx + 1) < 10 ? `0${idx + 1}` : `${idx + 1}`;
                  return (
                    <tr key={cs.id || idx}>
                      <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{sNoStr}</td>
                      <td><strong>{cs.service}</strong></td>
                      <td style={{ textAlign: 'center' }}>{cs.number_of_persons}</td>
                      <td style={{ textAlign: 'right' }}>{formatINR(cs.price_per_person)}</td>
                      <td style={{ textAlign: 'right', fontWeight: 'bold', color: '#0f2744' }}>
                        {formatINR(cs.total_cost)}
                      </td>
                      <td>{cs.remarks || '-'}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
            <tfoot>
              <tr style={{ background: '#f8fafc' }}>
                <td colSpan={4} style={{ textAlign: 'right', fontWeight: 'bold', fontSize: '10.5pt', color: '#0f2744' }}>
                  GRAND TOTAL COST:
                </td>
                <td style={{ textAlign: 'right', fontWeight: '800', fontSize: '11pt', color: '#1e3a8a' }}>
                  {formatINR(report.grand_total_cost || calculateGrandTotal(report.client_services))}
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </section>

        {/* Section 4 Print Table - Booking Services (DMC) */}
        <section className="print-section">
          <div className="print-section-title">4. Booking Services (DMC)</div>
          <table className="print-table print-dmc-table">
            <thead>
              <tr style={{ background: '#f1f5f9', color: '#1e293b' }}>
                <th style={{ width: '8%', textAlign: 'center', fontWeight: 'bold' }}>S.No</th>
                <th style={{ width: '24%', textAlign: 'left', fontWeight: 'bold' }}>Service</th>
                <th style={{ width: '22%', textAlign: 'left', fontWeight: 'bold' }}>Vendor</th>
                <th style={{ width: '16%', textAlign: 'left', fontWeight: 'bold' }}>Contact No</th>
                <th style={{ width: '10%', textAlign: 'center', fontWeight: 'bold' }}>No. of Persons</th>
                <th style={{ width: '10%', textAlign: 'right', fontWeight: 'bold' }}>Price / Pax</th>
                <th style={{ width: '10%', textAlign: 'right', fontWeight: 'bold' }}>Total Payable</th>
              </tr>
            </thead>
            <tbody>
              {(!report.dmc_services || report.dmc_services.length === 0) ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '10px', color: '#64748b' }}>
                    No DMC booking services recorded.
                  </td>
                </tr>
              ) : (
                report.dmc_services.map((ds, idx) => (
                  <tr key={ds.id || idx}>
                    <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{idx + 1}</td>
                    <td><strong>{ds.service}</strong></td>
                    <td><strong>{ds.vendor}</strong></td>
                    <td>{ds.contact_no || '-'}</td>
                    <td style={{ textAlign: 'center' }}>{ds.number_of_persons}</td>
                    <td style={{ textAlign: 'right' }}>{formatINR(ds.price_per_pax)}</td>
                    <td style={{ textAlign: 'right', fontWeight: 'bold', color: '#0f2744' }}>
                      {formatINR(ds.total_payable)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            <tfoot>
              <tr style={{ background: '#f8fafc' }}>
                <td colSpan={5} style={{ textAlign: 'right', fontWeight: 'bold', fontSize: '10.5pt', color: '#0f2744' }}>
                  TOTAL DMC COST:
                </td>
                <td colSpan={2} style={{ textAlign: 'right', fontWeight: '800', fontSize: '11pt', color: '#1e3a8a' }}>
                  {formatINR(report.total_dmc_cost || calculateTotalDMCCost(report.dmc_services))}
                </td>
              </tr>
            </tfoot>
          </table>
        </section>

        {/* Section 5 Print Section - GST Details & Calculation */}
        <section className="print-section">
          <div className="print-section-title">5. GST Details & Calculation</div>
          <div className="print-grid-3">
            <div className="print-row">
              <span className="print-lbl">GST Applicable:</span>
              <span className="print-val font-bold">{report.gst_collected ? 'Yes' : 'No'}</span>
            </div>
            <div className="print-row">
              <span className="print-lbl">GST Collected Date:</span>
              <span className="print-val">
                {report.gst_collected && report.gst_collected_date
                  ? formatDate(report.gst_collected_date)
                  : 'N/A'}
              </span>
            </div>
            <div className="print-row">
              <span className="print-lbl">GST Percentage:</span>
              <span className="print-val font-bold">
                {report.gst_collected ? `${report.gst_percentage}%` : '0%'}
              </span>
            </div>
            <div className="print-row">
              <span className="print-lbl">Base Total Cost:</span>
              <span className="print-val font-bold">{formatINR(report.base_total_cost)}</span>
            </div>
            <div className="print-row">
              <span className="print-lbl">GST Amount:</span>
              <span className="print-val font-bold">{formatINR(report.gst_amount)}</span>
            </div>
            <div className="print-row" style={{ background: '#eff6ff', padding: '4px 8px', borderRadius: '4px' }}>
              <span className="print-lbl" style={{ color: '#1e40af', fontWeight: 'bold' }}>FINAL TOTAL COST:</span>
              <span className="print-val font-bold" style={{ color: '#1e3a8a', fontSize: '10.5pt' }}>
                {formatINR(report.final_total_cost)}
              </span>
            </div>
          </div>
        </section>

        {/* Section 6 Print Section - Final Financial Summary */}
        <section className="print-section">
          <div className="print-section-title">6. Final Financial Summary</div>
          <table className="print-table">
            <thead>
              <tr style={{ background: '#1e293b', color: '#ffffff' }}>
                <th style={{ width: '10%', textAlign: 'center', fontWeight: 'bold' }}>#</th>
                <th style={{ width: '60%', textAlign: 'left', fontWeight: 'bold' }}>Financial Description</th>
                <th style={{ width: '30%', textAlign: 'right', fontWeight: 'bold' }}>Amount (INR)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ textAlign: 'center', fontWeight: 'bold' }}>01</td>
                <td>Total Cost <span style={{ color: '#64748b', fontSize: '8.5pt' }}>(Client Services Grand Total)</span></td>
                <td style={{ textAlign: 'right', fontWeight: '600' }}>{formatINR(report.total_cost)}</td>
              </tr>
              <tr>
                <td style={{ textAlign: 'center', fontWeight: 'bold' }}>02</td>
                <td>GST <span style={{ color: '#64748b', fontSize: '8.5pt' }}>(From GST Details Section)</span></td>
                <td style={{ textAlign: 'right', fontWeight: '600' }}>{formatINR(report.gst_amount)}</td>
              </tr>
              <tr style={{ background: '#f0f7ff' }}>
                <td style={{ textAlign: 'center', fontWeight: 'bold', color: '#1e40af' }}>03</td>
                <td style={{ fontWeight: 'bold', color: '#1e40af' }}>Total Cost with GST</td>
                <td style={{ textAlign: 'right', fontWeight: 'bold', color: '#1d4ed8' }}>{formatINR(report.total_cost_with_gst)}</td>
              </tr>
              <tr>
                <td style={{ textAlign: 'center', fontWeight: 'bold' }}>04</td>
                <td>Processing Fee</td>
                <td style={{ textAlign: 'right', fontWeight: '600' }}>{formatINR(report.processing_fee)}</td>
              </tr>
              <tr>
                <td style={{ textAlign: 'center', fontWeight: 'bold' }}>05</td>
                <td>Total Expense <span style={{ color: '#64748b', fontSize: '8.5pt' }}>(Booking Services - DMC Grand Total)</span></td>
                <td style={{ textAlign: 'right', fontWeight: '600' }}>{formatINR(report.total_expense)}</td>
              </tr>
              <tr style={{ background: parseFloat(report.net_profit) >= 0 ? '#ecfdf5' : '#fef2f2' }}>
                <td style={{ textAlign: 'center', fontWeight: 'bold', color: parseFloat(report.net_profit) >= 0 ? '#065f46' : '#991b1b' }}>06</td>
                <td style={{ fontWeight: '800', fontSize: '10.5pt', color: parseFloat(report.net_profit) >= 0 ? '#065f46' : '#991b1b' }}>
                  NET PROFIT
                </td>
                <td style={{ textAlign: 'right', fontWeight: '800', fontSize: '11.5pt', color: parseFloat(report.net_profit) >= 0 ? '#059669' : '#dc2626' }}>
                  {parseFloat(report.net_profit) < 0 ? `- ₹${Math.abs(report.net_profit).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : formatINR(report.net_profit)}
                </td>
              </tr>
            </tbody>
          </table>
        </section>

        {/* Section 7 Print Table - Payment Collection */}
        <section className="print-section">
          <div className="print-section-title">7. Payment Collection</div>
          <table className="print-table print-payment-table">
            <thead>
              <tr style={{ background: '#1e293b', color: '#ffffff' }}>
                <th style={{ width: '10%', textAlign: 'center', fontWeight: 'bold' }}>S.No</th>
                <th style={{ width: '25%', textAlign: 'left', fontWeight: 'bold' }}>Date</th>
                <th style={{ width: '35%', textAlign: 'right', fontWeight: 'bold' }}>Amount (INR)</th>
                <th style={{ width: '30%', textAlign: 'left', fontWeight: 'bold' }}>Payment Mode</th>
              </tr>
            </thead>
            <tbody>
              {(!report.payments || report.payments.length === 0) ? (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', padding: '10px', color: '#64748b' }}>
                    No payments recorded.
                  </td>
                </tr>
              ) : (
                report.payments.map((p, idx) => {
                  const sNoStr = (idx + 1) < 10 ? `0${idx + 1}` : `${idx + 1}`;
                  return (
                    <tr key={p.id || idx}>
                      <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{sNoStr}</td>
                      <td>{formatDate(p.payment_date)}</td>
                      <td style={{ textAlign: 'right', fontWeight: 'bold', color: '#0f2744' }}>
                        {formatINR(p.amount)}
                      </td>
                      <td><strong>{p.payment_mode || '-'}</strong></td>
                    </tr>
                  );
                })
              )}
            </tbody>
            <tfoot>
              <tr style={{ background: '#f8fafc' }}>
                <td colSpan={2} style={{ textAlign: 'right', fontWeight: 'bold', fontSize: '10.5pt', color: '#0f2744' }}>
                  TOTAL COLLECTED AMOUNT:
                </td>
                <td style={{ textAlign: 'right', fontWeight: '800', fontSize: '11pt', color: '#1e3a8a' }}>
                  {formatINR(report.total_collected_amount || calculateTotalCollected(report.payments))}
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </section>

        {/* Section 8 Print Table - Payment Spent */}
        <section className="print-section">
          <div className="print-section-title">8. Payment Spent</div>
          <table className="print-table print-spent-table">
            <thead>
              <tr style={{ background: '#1e293b', color: '#ffffff' }}>
                <th style={{ width: '8%', textAlign: 'center', fontWeight: 'bold' }}>S.No</th>
                <th style={{ width: '32%', textAlign: 'left', fontWeight: 'bold' }}>Details</th>
                <th style={{ width: '20%', textAlign: 'left', fontWeight: 'bold' }}>Date</th>
                <th style={{ width: '22%', textAlign: 'right', fontWeight: 'bold' }}>Amount (INR)</th>
                <th style={{ width: '18%', textAlign: 'left', fontWeight: 'bold' }}>Payment Mode</th>
              </tr>
            </thead>
            <tbody>
              {(!report.payments_spent || report.payments_spent.length === 0) ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '10px', color: '#64748b' }}>
                    No payment spent entries recorded.
                  </td>
                </tr>
              ) : (
                report.payments_spent.map((ps, idx) => {
                  const sNoStr = (idx + 1) < 10 ? `0${idx + 1}` : `${idx + 1}`;
                  return (
                    <tr key={ps.id || idx}>
                      <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{sNoStr}</td>
                      <td><strong>{ps.details}</strong></td>
                      <td>{formatDate(ps.payment_date)}</td>
                      <td style={{ textAlign: 'right', fontWeight: 'bold', color: '#0f2744' }}>
                        {formatINR(ps.amount)}
                      </td>
                      <td>{ps.payment_mode || '-'}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
            <tfoot>
              <tr style={{ background: '#f8fafc' }}>
                <td colSpan={3} style={{ textAlign: 'right', fontWeight: 'bold', fontSize: '10.5pt', color: '#0f2744' }}>
                  TOTAL SPENT AMOUNT:
                </td>
                <td style={{ textAlign: 'right', fontWeight: '800', fontSize: '11pt', color: '#1e3a8a' }}>
                  {formatINR(report.total_spent_amount || calculateTotalSpent(report.payments_spent))}
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </section>

        {/* Section 9 Print Section - Payment Balance Summary */}
        <section className="print-section">
          <div className="print-section-title">9. Payment Balance Summary</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            {/* Left Box: Client Payment Balance */}
            <div style={{ border: '1px solid #cbd5e1', borderRadius: '8px', padding: '12px', background: '#ffffff' }}>
              <div style={{ fontSize: '11pt', fontWeight: 'bold', color: '#14283F', marginBottom: '8px', borderBottom: '1px solid #e2e8f0', paddingBottom: '6px' }}>
                Client Payment Balance
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '9.5pt' }}>
                <span style={{ color: '#475569' }}>Total Client Amount:</span>
                <span style={{ fontWeight: '600', color: '#0f172a' }}>{formatINR(report.total_client_amount || report.total_cost)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '9.5pt' }}>
                <span style={{ color: '#475569' }}>Total Collected:</span>
                <span style={{ fontWeight: '600', color: '#0f172a' }}>{formatINR(report.total_collected || report.total_collected_amount)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 8px', borderRadius: '6px', background: '#fef3c7', border: '1px solid #fde68a' }}>
                <span style={{ fontWeight: 'bold', color: '#92400e', fontSize: '9.5pt' }}>YET TO RECEIVE:</span>
                <span style={{ fontWeight: '800', color: '#b45309', fontSize: '10.5pt' }}>
                  {formatSignedBalance(
                    report.yet_to_receive !== undefined 
                      ? report.yet_to_receive 
                      : ((parseFloat(report.total_cost || 0)) - (parseFloat(report.total_collected_amount || 0))).toFixed(2)
                  )}
                </span>
              </div>
            </div>

            {/* Right Box: Supplier Payment Balance */}
            <div style={{ border: '1px solid #cbd5e1', borderRadius: '8px', padding: '12px', background: '#ffffff' }}>
              <div style={{ fontSize: '11pt', fontWeight: 'bold', color: '#14283F', marginBottom: '8px', borderBottom: '1px solid #e2e8f0', paddingBottom: '6px' }}>
                Supplier Payment Balance
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '9.5pt' }}>
                <span style={{ color: '#475569' }}>Total to Supplier:</span>
                <span style={{ fontWeight: '600', color: '#0f172a' }}>{formatINR(report.total_to_supplier || report.total_expense)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '9.5pt' }}>
                <span style={{ color: '#475569' }}>Total Paid to Supplier:</span>
                <span style={{ fontWeight: '600', color: '#0f172a' }}>{formatINR(report.total_paid_to_supplier || report.total_spent_amount)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 8px', borderRadius: '6px', background: '#eff6ff', border: '1px solid #bfdbfe' }}>
                <span style={{ fontWeight: 'bold', color: '#1e40af', fontSize: '9.5pt' }}>YET TO SUPPLIER:</span>
                <span style={{ fontWeight: '800', color: '#1d4ed8', fontSize: '10.5pt' }}>
                  {formatSignedBalance(
                    report.yet_to_supplier !== undefined 
                      ? report.yet_to_supplier 
                      : ((parseFloat(report.total_expense || 0)) - (parseFloat(report.total_spent_amount || 0))).toFixed(2)
                  )}
                </span>
              </div>
            </div>
          </div>
        </section>

        <footer className="print-footer" style={{ marginTop: '24px' }}>
          <div className="print-signature-box">
            <div className="signature-line"></div>
            <span>Prepared By ({report.sales_by || 'Sales Executive'})</span>
          </div>
          <div className="print-signature-box">
            <div className="signature-line"></div>
            <span>Verified By (Operations / Accounts)</span>
          </div>
          <div className="print-signature-box">
            <div className="signature-line"></div>
            <span>Authorized Signature</span>
          </div>
        </footer>
        </div>
      </div>
    </>
  );
};

export default FinalReportView;
