import React, { useState, useEffect } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Edit3, Printer, AlertCircle } from 'lucide-react';
import { firstReportService } from '../services/firstReportApi';
import ServicesClient, { formatINR, calculateGrandTotal } from '../components/ServicesClient';
import BookingServicesDMC, { calculateTotalDMCCost } from '../components/BookingServicesDMC';
import ProfitSummary, { calculateApproxProfit } from '../components/ProfitSummary';
import DownloadPDFButton from '../components/DownloadPDFButton';
import '../styles/FirstReportView.css';
import '../styles/FirstReportPrint.css';

const FirstReportView = () => {
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
        const data = await firstReportService.getById(id);
        const record = data.data || data;
        setReport(record);
      } catch (err) {
        console.error('Error fetching report:', err);
        setError('Failed to load report from server. Please verify the ID.');
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [id]);

  // Handle auto-print if triggered with ?print=true
  useEffect(() => {
    if (!loading && report && shouldAutoPrint) {
      // Small timeout to allow styles and DOM to settle
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
          <h3>Loading Report Details...</h3>
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
          <h3>Report Not Found</h3>
          <p style={{ color: 'var(--muted-text)', marginBottom: '20px' }}>{error}</p>
          <Link to="/first-report" className="btn-view-action btn-view-back">
            <ArrowLeft size={16} />
            <span>Back to First Reports</span>
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
          <Link to="/first-report" className="back-nav-link" id="view-back-to-list-link">
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
              <Link to="/first-report" className="btn-view-action btn-view-back">
                <ArrowLeft size={16} />
                <span>Back</span>
              </Link>

              <Link
                to={`/first-report/${report.id}/edit`}
                className="btn-view-action btn-view-edit"
                id="view-edit-btn"
              >
                <Edit3 size={16} />
                <span>Edit Report</span>
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
                reportType="first"
                reportId={report.id}
                crmId={report.crm_id}
                id="view-download-pdf-btn"
              >
                Download PDF
              </DownloadPDFButton>
            </div>
          </div>
        </div>

        {/* Saved Data Display in Two Exact Sections */}
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

          {/* Section 5 – Profit Summary */}
          <ProfitSummary
            clientServices={report.client_services || []}
            dmcServices={report.dmc_services || []}
            initialTotalCost={report.total_cost}
            initialTotalExpense={report.total_expense}
            initialApproxProfit={report.approx_profit}
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
      {/* Dedicated A4 Print Sheet (Shown only during @media print) */}
      {/* ========================================================= */}
      <div className="print-only-container">
        <div className="print-sheet">
          {/* Header */}
          <div className="print-header">
            <h1 className="print-company-name">ASPIRE TOURISM INDIA PVT LTD – FIRST REPORT</h1>
            <h2 className="print-subtitle">Tour Confirmation Sheet</h2>
          </div>

          {/* Section 1 Print Table */}
          <div className="print-section-title">1. Tour Confirmation Details</div>
          <table className="print-table">
            <tbody>
              <tr>
                <td className="label-cell">Report Date:</td>
                <td className="value-cell">{formatDate(report.report_date)}</td>
                <td className="label-cell">CRM ID:</td>
                <td className="value-cell value-highlight">{report.crm_id}</td>
              </tr>
              <tr>
                <td className="label-cell">Date of Travel:</td>
                <td className="value-cell">{formatDate(report.travel_date)}</td>
                <td className="label-cell">Sales By:</td>
                <td className="value-cell">{report.sales_by}</td>
              </tr>
              <tr>
                <td className="label-cell">Tour Type:</td>
                <td className="value-cell">{report.tour_type}</td>
                <td className="label-cell">Branch:</td>
                <td className="value-cell">{report.branch}</td>
              </tr>
            </tbody>
          </table>

          {/* Section 2 Print Table - Excel Style Arrangement */}
          <div className="print-section-title" style={{ marginTop: '12px' }}>
            2. Guest & Tour Information
          </div>
          <table className="excel-guest-grid">
            <thead>
              <tr>
                <th className="excel-col-header" style={{ width: '38%' }}>Guest Profile</th>
                <th className="excel-col-header" style={{ width: '28%' }}>Passenger Count</th>
                <th className="excel-col-header" style={{ width: '34%' }}>Tour Specs</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Guest Name:</strong> {report.guest_name}</td>
                <td><strong>Adults:</strong> {report.adults}</td>
                <td><strong>Client Type:</strong> {report.client_type}</td>
              </tr>
              <tr>
                <td><strong>Mobile No:</strong> {report.mobile_no}</td>
                <td><strong>Child:</strong> {report.child}</td>
                <td><strong>Destination:</strong> {report.destination}</td>
              </tr>
              <tr>
                <td><strong>DOB:</strong> {formatDate(report.dob)}</td>
                <td><strong style={{ color: '#0f2744' }}>Total Pax:</strong> <strong>{report.total_pax}</strong></td>
                <td><strong>Duration:</strong> {report.duration} Days</td>
              </tr>
              <tr>
                <td><strong>Email ID:</strong> {report.email_id || '-'}</td>
                <td style={{ background: '#f8fafc' }}></td>
                <td><strong>Rooms:</strong> {report.rooms}</td>
              </tr>
            </tbody>
          </table>

          {/* Section 3 Print Table - Services (Client) */}
          <div className="print-section-title" style={{ marginTop: '12px' }}>
            3. Services (Client)
          </div>
          <table className="print-table print-services-table">
            <thead>
              <tr style={{ background: '#f1f5f9', color: '#1e293b' }}>
                <th style={{ width: '8%', textAlign: 'center', fontWeight: 'bold' }}>S.No</th>
                <th style={{ width: '30%', textAlign: 'left', fontWeight: 'bold' }}>Service</th>
                <th style={{ width: '12%', textAlign: 'center', fontWeight: 'bold' }}>No. of Persons</th>
                <th style={{ width: '15%', textAlign: 'right', fontWeight: 'bold' }}>Price / Person</th>
                <th style={{ width: '15%', textAlign: 'right', fontWeight: 'bold' }}>Total Cost</th>
                <th style={{ width: '20%', textAlign: 'left', fontWeight: 'bold' }}>Remarks</th>
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

          {/* Section 4 Print Table - Booking Services (DMC) */}
          <div className="print-section-title" style={{ marginTop: '12px' }}>
            4. Booking Services (DMC)
          </div>
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

          {/* Section 5 Print Table - Profit Summary */}
          <div className="print-section-title" style={{ marginTop: '12px' }}>
            5. Profit Summary
          </div>
          <table className="print-table print-profit-table">
            <tbody>
              <tr>
                <td className="label-cell" style={{ width: '33.33%', textAlign: 'center', background: '#f8fafc' }}>
                  <strong>TOTAL COST (CLIENT)</strong>
                </td>
                <td className="label-cell" style={{ width: '33.33%', textAlign: 'center', background: '#f8fafc' }}>
                  <strong>TOTAL EXPENSE (DMC)</strong>
                </td>
                <td className="label-cell" style={{ width: '33.34%', textAlign: 'center', background: '#f8fafc' }}>
                  <strong>APPROX PROFIT</strong>
                </td>
              </tr>
              <tr>
                <td style={{ textAlign: 'center', fontSize: '12pt', fontWeight: 'bold', color: '#1d4ed8' }}>
                  {formatINR(report.total_cost || calculateGrandTotal(report.client_services))}
                </td>
                <td style={{ textAlign: 'center', fontSize: '12pt', fontWeight: 'bold', color: '#334155' }}>
                  {formatINR(report.total_expense || calculateTotalDMCCost(report.dmc_services))}
                </td>
                {(() => {
                  const costVal = report.total_cost || calculateGrandTotal(report.client_services);
                  const expVal = report.total_expense || calculateTotalDMCCost(report.dmc_services);
                  const profitVal = report.approx_profit || calculateApproxProfit(costVal, expVal);
                  const pNum = parseFloat(profitVal) || 0;
                  const pColor = pNum > 0 ? '#059669' : pNum < 0 ? '#dc2626' : '#475569';
                  return (
                    <td style={{ textAlign: 'center', fontSize: '12pt', fontWeight: '800', color: pColor }}>
                      {formatINR(profitVal)}
                    </td>
                  );
                })()}
              </tr>
            </tbody>
          </table>

          {/* Signatures */}
          <div className="print-footer-signatures">
            <div className="sign-box">Prepared By (Sales)</div>
            <div className="sign-box">Verified By (Operations)</div>
            <div className="sign-box">Guest Signature</div>
          </div>

          {/* Meta Bar */}
          <div className="print-meta-bar">
            <span>Aspire Tour ERP System • Generated: {new Date().toLocaleString()}</span>
            <span>Document Ref: FR-{report.crm_id}</span>
          </div>
        </div>
      </div>
    </>
  );
};

export default FirstReportView;
