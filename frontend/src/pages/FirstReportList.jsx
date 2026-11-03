import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  Eye, 
  Edit3, 
  Printer, 
  Trash2,
  AlertCircle, 
  AlertTriangle,
  CheckCircle2, 
  RotateCcw,
  X,
  FileText
} from 'lucide-react';
import DownloadPDFButton from '../components/DownloadPDFButton';
import { firstReportService } from '../services/firstReportApi';
import '../styles/FirstReportList.css';

const FirstReportList = () => {
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

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState(null); // { id, crm_id, guest_name }
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const cancelBtnRef = useRef(null);

  // Clear route location state after displaying flash message
  useEffect(() => {
    if (location.state?.flashMessage) {
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Fetch all reports from backend
  const fetchReports = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await firstReportService.getAll();
      const list = Array.isArray(data) ? data : (data.results || data.data || []);
      setReports(list);
    } catch (err) {
      console.error('Error fetching first reports:', err);
      setError('Failed to load First Reports from the server. Please check that the backend is running.');
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

  // Pagination calculation with automatic adjustment if page becomes empty
  const totalPages = Math.max(1, Math.ceil(filteredReports.length / pageSize));

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedReports = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredReports.slice(start, start + pageSize);
  }, [filteredReports, currentPage, pageSize]);

  // Accessibility: Focus cancel button and handle Escape in modal
  useEffect(() => {
    if (deleteTarget) {
      const timer = setTimeout(() => {
        if (cancelBtnRef.current) {
          cancelBtnRef.current.focus();
        }
      }, 50);

      const handleKeyDown = (e) => {
        if (e.key === 'Escape' && !isDeleting) {
          closeDeleteModal();
        }
      };

      document.addEventListener('keydown', handleKeyDown);
      return () => {
        clearTimeout(timer);
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [deleteTarget, isDeleting]);

  // Open delete modal
  const openDeleteModal = (report) => {
    setDeleteTarget(report);
    setDeleteError('');
  };

  // Close delete modal
  const closeDeleteModal = () => {
    if (isDeleting) return;
    setDeleteTarget(null);
    setDeleteError('');
  };

  // Confirm delete handler
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    setIsDeleting(true);
    setDeleteError('');

    try {
      // Call backend DELETE API using primary key id
      await firstReportService.delete(deleteTarget.id);

      // Close modal
      setDeleteTarget(null);

      // Show success notification
      setFlashMessage(`First Report (CRM ID: ${deleteTarget.crm_id}) deleted successfully.`);

      // Refresh list from backend while keeping user on same list page & search/filters intact
      const updatedData = await firstReportService.getAll();
      const list = Array.isArray(updatedData) ? updatedData : (updatedData.results || updatedData.data || []);
      setReports(list);
    } catch (err) {
      console.error('Error deleting report:', err);
      if (err.response && err.response.status === 404) {
        setDeleteError('This record could not be found. It may have already been removed.');
      } else if (err.response && err.response.data?.message) {
        setDeleteError(err.response.data.message);
      } else {
        setDeleteError('Failed to delete report from the server. Please try again.');
      }
    } finally {
      setIsDeleting(false);
    }
  };

  // Format date helper DD/MM/YYYY
  const formatDate = (isoString) => {
    if (!isoString) return '-';
    const parts = isoString.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return isoString;
  };

  return (
    <div className="report-list-page">
      {/* Page Header */}
      <div className="report-list-header">
        <div className="report-list-header-left">
          <h1 className="report-list-title">First Report</h1>
          <p className="report-list-subtitle">Manage and track all tour confirmation reports.</p>
        </div>
        <Link to="/first-report/new" className="btn-primary-add" id="add-new-report-btn">
          <Plus size={18} />
          <span>Add New Report</span>
        </Link>
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
            <select
              className="report-filter-select"
              value={tourTypeFilter}
              onChange={(e) => setTourTypeFilter(e.target.value)}
              aria-label="Filter by Tour Type"
            >
              <option value="">All Tour Types</option>
              <option value="International">International</option>
              <option value="Domestic">Domestic</option>
            </select>

            <select
              className="report-filter-select"
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
              aria-label="Filter by Branch"
            >
              <option value="">All Branches</option>
              <option value="Coimbatore">Coimbatore</option>
              <option value="Chennai">Chennai</option>
              <option value="Erode">Erode</option>
              <option value="Tiruppur">Tiruppur</option>
              <option value="Salem">Salem</option>
            </select>

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
            <h3 className="report-empty-title">Loading First Reports...</h3>
            <p className="report-empty-description">Fetching confirmation sheets from server.</p>
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
        ) : reports.length === 0 ? (
          <div className="report-empty-state">
            <div className="report-empty-icon">
              <FileText size={32} />
            </div>
            <h3 className="report-empty-title">No First Reports Found</h3>
            <p className="report-empty-description">Start by creating your first tour confirmation sheet.</p>
            <div className="report-empty-action">
              <Link to="/first-report/new" className="btn-primary-add">
                <Plus size={18} />
                <span>Add New Report</span>
              </Link>
            </div>
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="report-empty-state">
            <div className="report-empty-icon">
              <Search size={32} />
            </div>
            <h3 className="report-empty-title">No Matching Records</h3>
            <p className="report-empty-description">No reports matched your search or filter criteria.</p>
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
                    <th>Mobile Number</th>
                    <th>Destination</th>
                    <th>Tour Type</th>
                    <th>Date of Travel</th>
                    <th>Sales By</th>
                    <th>Branch</th>
                    <th style={{ textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedReports.map((report, index) => {
                    const serialNumber = (currentPage - 1) * pageSize + index + 1;
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
                        <td>
                          <div className="action-buttons-cell">
                            {/* View Action */}
                            <Link
                              to={`/first-report/${report.id}/view`}
                              className="action-icon-btn view-btn"
                              title="View Report"
                              aria-label={`View Report ${report.crm_id}`}
                            >
                              <Eye size={16} />
                            </Link>

                            {/* Edit Action */}
                            <Link
                              to={`/first-report/${report.id}/edit`}
                              className="action-icon-btn edit-btn"
                              title="Edit Report"
                              aria-label={`Edit Report ${report.crm_id}`}
                            >
                              <Edit3 size={16} />
                            </Link>

                            {/* Print Action */}
                            <button
                              type="button"
                              className="action-icon-btn print-btn"
                              title="Print Report"
                              aria-label={`Print Report ${report.crm_id}`}
                              onClick={() => {
                                navigate(`/first-report/${report.id}/view?print=true`);
                              }}
                            >
                              <Printer size={16} />
                            </button>

                            {/* Download PDF Action */}
                            <DownloadPDFButton
                              reportType="first"
                              reportId={report.id}
                              crmId={report.crm_id}
                              variant="icon"
                              title={`Download PDF for CRM ${report.crm_id}`}
                            />

                            {/* Delete Action */}
                            <button
                              type="button"
                              className="action-icon-btn delete-btn"
                              title="Delete Report"
                              aria-label={`Delete Report ${report.crm_id}`}
                              onClick={() => openDeleteModal(report)}
                            >
                              <Trash2 size={16} />
                            </button>
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
                  {filteredReports.length} reports
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
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
                    <button
                      key={pg}
                      type="button"
                      className={`page-btn ${pg === currentPage ? 'active' : ''}`}
                      onClick={() => setCurrentPage(pg)}
                    >
                      {pg}
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

      {/* ========================================================= */}
      {/* Delete Confirmation Modal                                 */}
      {/* ========================================================= */}
      {deleteTarget && (
        <div 
          className="modal-overlay" 
          onClick={(e) => {
            if (e.target === e.currentTarget && !isDeleting) {
              closeDeleteModal();
            }
          }}
          role="presentation"
        >
          <div 
            className="modal-card" 
            role="dialog" 
            aria-modal="true" 
            aria-labelledby="delete-dialog-title"
            aria-describedby="delete-dialog-desc"
          >
            <div className="modal-header-section">
              <div className="modal-danger-icon">
                <AlertTriangle size={24} />
              </div>
              <div className="modal-header-text">
                <h3 id="delete-dialog-title" className="modal-title">
                  Delete First Report?
                </h3>
                <p id="delete-dialog-desc" className="modal-message">
                  Are you sure you want to delete CRM ID #{deleteTarget.crm_id} – {deleteTarget.guest_name}? This action cannot be undone.
                </p>
              </div>
            </div>

            {deleteError && (
              <div className="modal-error-alert" role="alert">
                <AlertCircle size={16} />
                <span>{deleteError}</span>
              </div>
            )}

            <div className="modal-actions">
              <button
                type="button"
                ref={cancelBtnRef}
                className="btn-modal-cancel"
                onClick={closeDeleteModal}
                disabled={isDeleting}
                id="cancel-delete-btn"
              >
                Cancel
              </button>

              <button
                type="button"
                className="btn-modal-delete"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                id="confirm-delete-btn"
              >
                {isDeleting ? (
                  <>
                    <span className="modal-spinner"></span>
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 size={16} />
                    <span>Yes, Delete</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FirstReportList;
