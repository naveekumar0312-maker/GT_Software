import React, { useState, useEffect, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  Eye, 
  Edit3, 
  Printer, 
  AlertCircle, 
  CheckCircle2, 
  RotateCcw,
  X,
  FileCheck
} from 'lucide-react';
import DownloadPDFButton from '../components/DownloadPDFButton';
import CustomDropdown from '../components/CustomDropdown';
import { firstReportService } from '../services/firstReportApi';
import '../styles/FirstReportList.css';

const FinalReportList = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [flashMessage, setFlashMessage] = useState(location.state?.flashMessage || '');

  // Filter and Search states
  const [searchTerm, setSearchTerm] = useState('');
  const [tourTypeFilter, setTourTypeFilter] = useState('');
  const [branchFilter, setBranchFilter] = useState('');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Clear route location state after displaying flash message
  useEffect(() => {
    if (location.state?.flashMessage) {
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Fetch all First Reports from backend (the master booking list)
  const fetchReports = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await firstReportService.getAll();
      const list = Array.isArray(data) ? data : (data.results || data.data || []);
      setReports(list);
    } catch (err) {
      console.error('Error fetching first reports for Final Report module:', err);
      setError('Failed to load booking records from the server. Please check that the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  // Filter and search logic
  const filteredReports = useMemo(() => {
    return reports.filter((item) => {
      const q = searchTerm.toLowerCase().trim();
      const matchSearch = !q || (
        (item.crm_id && String(item.crm_id).toLowerCase().includes(q)) ||
        (item.guest_name && item.guest_name.toLowerCase().includes(q)) ||
        (item.mobile_no && String(item.mobile_no).includes(q)) ||
        (item.destination && item.destination.toLowerCase().includes(q))
      );

      const matchTourType = !tourTypeFilter || item.tour_type === tourTypeFilter;
      const matchBranch = !branchFilter || item.branch === branchFilter;

      return matchSearch && matchTourType && matchBranch;
    });
  }, [reports, searchTerm, tourTypeFilter, branchFilter]);

  // Reset pagination when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, tourTypeFilter, branchFilter]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredReports.length / pageSize));

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  const paginatedReports = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredReports.slice(startIndex, startIndex + pageSize);
  }, [filteredReports, currentPage, pageSize]);

  // Date formatter (DD/MM/YYYY)
  const formatDate = (isoString) => {
    if (!isoString) return '-';
    const parts = String(isoString).split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return isoString;
  };

  return (
    <div className="report-list-page">
      {/* Top Header */}
      <div className="report-list-header">
        <div className="report-list-header-left">
          <h1 className="report-list-title">Final Report</h1>
          <p className="report-list-subtitle">Manage and view final tour confirmation reports.</p>
        </div>
      </div>

      {/* Success / Info Flash Message */}
      {flashMessage && (
        <div className="alert-banner alert-success" role="alert">
          <CheckCircle2 size={19} className="alert-icon" />
          <div className="alert-content">{flashMessage}</div>
          <button 
            type="button" 
            className="alert-close-btn" 
            onClick={() => setFlashMessage('')}
            aria-label="Dismiss notification"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Controls Bar: Search & Filters */}
      <div className="report-filter-card">
        <div className="report-filter-row">
          <div className="report-search">
            <span className="report-search-icon">
              <Search size={18} />
            </span>
            <input
              type="text"
              className="report-search-input"
              placeholder="Search by CRM ID, Guest Name, Mobile No..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                type="button"
                className="search-clear-btn"
                onClick={() => setSearchTerm('')}
                aria-label="Clear search"
              >
                <X size={16} />
              </button>
            )}
          </div>

          <div className="report-filter-dropdowns">
            <div style={{ minWidth: 160 }}>
              <CustomDropdown
                value={tourTypeFilter}
                onChange={(e) => setTourTypeFilter(e.target.value)}
                options={[
                  { value: '', label: 'All Tour Types' },
                  { value: 'International', label: 'International' },
                  { value: 'Domestic', label: 'Domestic' },
                ]}
              />
            </div>

            <div style={{ minWidth: 150 }}>
              <CustomDropdown
                value={branchFilter}
                onChange={(e) => setBranchFilter(e.target.value)}
                options={[
                  { value: '', label: 'All Branches' },
                  { value: 'Coimbatore', label: 'Coimbatore' },
                  { value: 'Chennai', label: 'Chennai' },
                  { value: 'Erode', label: 'Erode' },
                  { value: 'Tiruppur', label: 'Tiruppur' },
                  { value: 'Salem', label: 'Salem' },
                ]}
              />
            </div>

            {(searchTerm || tourTypeFilter || branchFilter) && (
              <button
                type="button"
                className="btn-filter-reset"
                onClick={() => {
                  setSearchTerm('');
                  setTourTypeFilter('');
                  setBranchFilter('');
                }}
              >
                <RotateCcw size={14} />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area: Table / Loading / Error / Empty States */}
      <div className="list-table-card">
        {loading ? (
          <div className="report-empty-state">
            <div className="loading-spinner"></div>
            <h3 className="report-empty-title">Loading Booking Records...</h3>
            <p className="report-empty-description">Fetching First Report bookings from server.</p>
          </div>
        ) : error ? (
          <div className="report-empty-state">
            <div className="report-empty-icon" style={{ color: '#dc2626' }}>
              <AlertCircle size={32} />
            </div>
            <h3 className="report-empty-title">Unable to Load Reports</h3>
            <p className="report-empty-description">{error}</p>
            <button type="button" className="btn-retry" onClick={fetchReports}>
              <RotateCcw size={16} />
              <span>Retry</span>
            </button>
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="report-empty-state">
            <div className="report-empty-icon">
              <FileCheck size={36} />
            </div>
            <h3 className="report-empty-title">
              {reports.length === 0 ? 'No Booking Records Found' : 'No Matching Bookings Found'}
            </h3>
            <p className="report-empty-description">
              {reports.length === 0
                ? 'Create a First Report booking first to generate its Final Report confirmation.'
                : 'Try adjusting your search criteria or clearing active filters.'}
            </p>
            {reports.length > 0 && (
              <div className="report-empty-action">
                <button
                  type="button"
                  className="btn-clear-search"
                  onClick={() => {
                    setSearchTerm('');
                    setTourTypeFilter('');
                    setBranchFilter('');
                  }}
                >
                  Clear All Filters
                </button>
              </div>
            )}
          </div>
        ) : (
          <>
            <div className="table-responsive-wrapper">
              <table className="first-report-table">
                <thead>
                  <tr>
                    <th>S.No</th>
                    <th>CRM ID</th>
                    <th>Guest Name</th>
                    <th>Mobile No</th>
                    <th>Destination</th>
                    <th>Tour Type</th>
                    <th>Date of Travel</th>
                    <th>Sales By</th>
                    <th>Branch</th>
                    <th style={{ textAlign: 'center' }}>Status</th>
                    <th style={{ textAlign: 'center' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedReports.map((report, index) => {
                    const serialNumber = (currentPage - 1) * pageSize + index + 1;
                    const isCompleted = report.final_report_status === 'Completed';
                    const finalReportId = report.final_report_id;

                    return (
                      <tr key={report.id || index}>
                        <td>{serialNumber}</td>
                        <td>
                          <span className="crm-badge">{report.crm_id}</span>
                        </td>
                        <td style={{ fontWeight: 600 }}>{report.guest_name}</td>
                        <td>{report.mobile_no}</td>
                        <td>{report.destination}</td>
                        <td>
                          <span className={`tour-badge ${(report.tour_type || '').toLowerCase()}`}>
                            {report.tour_type}
                          </span>
                        </td>
                        <td>{formatDate(report.travel_date)}</td>
                        <td>{report.sales_by}</td>
                        <td>
                          <span className="branch-tag">{report.branch}</span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span className={`status-badge ${isCompleted ? 'status-completed' : 'status-pending'}`}>
                            <span className="status-badge-dot"></span>
                            <span>{isCompleted ? 'Completed' : 'Pending'}</span>
                          </span>
                        </td>
                        <td>
                          <div className="action-buttons-cell">
                            {isCompleted && finalReportId ? (
                              <>
                                {/* View Action for Saved Final Report */}
                                <Link
                                  to={`/final-report/${finalReportId}/view`}
                                  className="action-icon-btn view-btn"
                                  title="View Final Report"
                                  aria-label={`View Final Report ${report.crm_id}`}
                                >
                                  <Eye size={16} />
                                </Link>

                                {/* Edit Action for Saved Final Report */}
                                <Link
                                  to={`/final-report/${finalReportId}/edit`}
                                  className="action-icon-btn edit-btn"
                                  title="Edit Final Report"
                                  aria-label={`Edit Final Report ${report.crm_id}`}
                                >
                                  <Edit3 size={16} />
                                </Link>

                                {/* Print Action for Saved Final Report */}
                                <button
                                  type="button"
                                  className="action-icon-btn print-btn"
                                  title="Print Final Report"
                                  aria-label={`Print Final Report ${report.crm_id}`}
                                  onClick={() => {
                                    navigate(`/final-report/${finalReportId}/view?print=true`);
                                  }}
                                >
                                  <Printer size={16} />
                                </button>

                                {/* Download PDF Action for Saved Final Report */}
                                <DownloadPDFButton
                                  reportType="final"
                                  reportId={finalReportId}
                                  crmId={report.crm_id}
                                  variant="icon"
                                  title={`Download PDF for Final Report CRM ${report.crm_id}`}
                                />
                              </>
                            ) : (
                              /* Pending: + Button to create Final Report prefilled from this First Report */
                              <Link
                                to={`/final-report/new?first_report_id=${report.id}`}
                                className="action-icon-btn action-plus-btn"
                                title="Create Final Report from this booking"
                                aria-label={`Create Final Report for CRM ${report.crm_id}`}
                              >
                                <Plus size={17} />
                              </Link>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="pagination-bar">
                <span className="pagination-info">
                  Showing {(currentPage - 1) * pageSize + 1} to{' '}
                  {Math.min(currentPage * pageSize, filteredReports.length)} of{' '}
                  {filteredReports.length} bookings
                </span>
                <div className="pagination-controls">
                  <button
                    type="button"
                    className="page-btn"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  >
                    Previous
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                    <button
                      key={pageNum}
                      type="button"
                      className={`page-btn ${pageNum === currentPage ? 'active' : ''}`}
                      onClick={() => setCurrentPage(pageNum)}
                    >
                      {pageNum}
                    </button>
                  ))}
                  <button
                    type="button"
                    className="page-btn"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default FinalReportList;
