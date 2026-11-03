import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FileText,
  FileCheck,
  TrendingUp,
  Coins,
  RefreshCw,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  Building,
  Globe,
  Wallet,
  Eye
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import {
  getDashboardOverview,
  getFinancialChartData,
  getReportStatusOverview,
  getPaymentSummary,
  getRecentReports,
  getUpcomingTours
} from '../services/dashboardApi';
import '../styles/Dashboard.css';

// Currency formatter for INR
const formatINR = (val) => {
  const num = Number(val) || 0;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(num);
};

// Date Formatter helper
const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
};

export default function Dashboard() {
  const navigate = useNavigate();

  // Filters State - Default to 'all_time' so existing records are visible immediately
  const [dateRange, setDateRange] = useState('all_time');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [branch, setBranch] = useState('ALL');
  const [tourType, setTourType] = useState('ALL');

  // Data States
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [overview, setOverview] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [reportStatus, setReportStatus] = useState(null);
  const [paymentSummary, setPaymentSummary] = useState(null);
  const [recentReports, setRecentReports] = useState({ first_reports: [], final_reports: [] });
  const [upcomingTours, setUpcomingTours] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');

  // Fetch all dashboard data using current filters
  const fetchDashboardData = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setErrorMessage('');

    const params = {
      date_range: dateRange,
      branch: branch,
      tour_type: tourType
    };

    if (dateRange === 'custom') {
      if (customStart) params.date_from = customStart;
      if (customEnd) params.date_to = customEnd;
    }

    try {
      const [
        overviewRes,
        chartRes,
        statusRes,
        paymentRes,
        recentRes,
        upcomingRes
      ] = await Promise.all([
        getDashboardOverview(params),
        getFinancialChartData(params),
        getReportStatusOverview(params),
        getPaymentSummary(params),
        getRecentReports(params),
        getUpcomingTours(params)
      ]);

      setOverview(overviewRes.data);
      setChartData(chartRes.data?.chart_data || []);
      setReportStatus(statusRes.data);
      setPaymentSummary(paymentRes.data);
      
      const recData = recentRes.data || {};
      setRecentReports({
        first_reports: recData.recent_first_reports || recData.first_reports || [],
        final_reports: recData.recent_final_reports || recData.final_reports || []
      });
      
      setUpcomingTours(upcomingRes.data?.upcoming_tours || []);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setErrorMessage('Failed to load dashboard metrics. Please verify database connection or retry.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [dateRange, customStart, customEnd, branch, tourType]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Today display
  const todayFormatted = new Intl.DateTimeFormat('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }).format(new Date());

  return (
    <div className="dashboard-container">
      {/* 1. TOP DASHBOARD HEADER */}
      <div className="dashboard-header-wrapper">
        <div className="dashboard-title-row">
          <div className="dashboard-title-group">
            <h1>Dashboard</h1>
            <p className="dashboard-subtitle">Welcome to CRM – Business Performance Overview</p>
          </div>
          <div className="dashboard-date-badge">
            <Calendar size={16} />
            <span>{todayFormatted}</span>
          </div>
        </div>

        {/* Dashboard Filters Bar */}
        <div className="dashboard-filters-bar">
          <div className="dashboard-filter-group">
            {/* Date Range Preset */}
            <div className="filter-select-wrapper">
              <span className="filter-label">Period</span>
              <select
                className="dashboard-select"
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
              >
                <option value="all_time">All Time</option>
                <option value="today">Today</option>
                <option value="this_week">This Week</option>
                <option value="this_month">This Month</option>
                <option value="last_month">Last Month</option>
                <option value="this_year">This Year</option>
                <option value="custom">Custom Date Range</option>
              </select>
            </div>

            {/* Custom Date Pickers */}
            {dateRange === 'custom' && (
              <div className="filter-select-wrapper">
                <span className="filter-label">Custom Range</span>
                <div className="custom-date-range">
                  <input
                    type="date"
                    className="dashboard-date-input"
                    value={customStart}
                    onChange={(e) => setCustomStart(e.target.value)}
                  />
                  <span className="date-separator">to</span>
                  <input
                    type="date"
                    className="dashboard-date-input"
                    value={customEnd}
                    onChange={(e) => setCustomEnd(e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* Branch Filter */}
            <div className="filter-select-wrapper">
              <span className="filter-label">Branch</span>
              <select
                className="dashboard-select"
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
              >
                <option value="ALL">All Branches</option>
                <option value="Coimbatore">Coimbatore</option>
                <option value="Chennai">Chennai</option>
                <option value="Erode">Erode</option>
                <option value="Tiruppur">Tiruppur</option>
                <option value="Salem">Salem</option>
              </select>
            </div>

            {/* Tour Type Filter */}
            <div className="filter-select-wrapper">
              <span className="filter-label">Tour Type</span>
              <select
                className="dashboard-select"
                value={tourType}
                onChange={(e) => setTourType(e.target.value)}
              >
                <option value="ALL">All Tour Types</option>
                <option value="International">International</option>
                <option value="Domestic">Domestic</option>
              </select>
            </div>
          </div>

          {/* Refresh Data Button */}
          <button
            className="dashboard-refresh-btn"
            onClick={() => fetchDashboardData(true)}
            disabled={refreshing || loading}
          >
            <RefreshCw size={15} className={refreshing ? 'spin-icon' : ''} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh Data'}</span>
          </button>
        </div>
      </div>

      {/* Global Error Banner */}
      {errorMessage && (
        <div style={{
          backgroundColor: '#FEE2E2',
          border: '1px solid #FECACA',
          color: '#DC2626',
          padding: '14px 20px',
          borderRadius: '10px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          fontSize: '13.5px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <AlertCircle size={18} />
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={() => fetchDashboardData(true)}
            style={{
              background: '#DC2626',
              color: '#FFFFFF',
              border: 'none',
              padding: '6px 14px',
              borderRadius: '6px',
              fontWeight: 600,
              cursor: 'pointer',
              fontSize: '12.5px'
            }}
          >
            Retry
          </button>
        </div>
      )}

      {/* 2. FOUR MAIN KPI CONTAINERS */}
      <div className="dashboard-kpi-grid">
        {/* KPI 1: Total First Reports */}
        <div
          className="kpi-card"
          onClick={() => navigate('/first-report')}
          role="button"
          tabIndex={0}
        >
          <div>
            <div className="kpi-card-header">
              <span className="kpi-title">Total First Reports</span>
              <div className="kpi-icon-badge blue">
                <FileText size={20} />
              </div>
            </div>
            {loading ? (
              <div className="skeleton-line skeleton-kpi-value" />
            ) : (
              <h3 className="kpi-value">{overview?.kpi_first_reports?.value ?? 0}</h3>
            )}
          </div>
          <div className="kpi-footer">
            {overview?.kpi_first_reports?.growth_percent !== null && overview?.kpi_first_reports?.growth_percent !== undefined ? (
              <span className={`kpi-comparison ${overview.kpi_first_reports.growth_percent >= 0 ? 'positive' : 'negative'}`}>
                {overview.kpi_first_reports.growth_percent >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                {Math.abs(overview.kpi_first_reports.growth_percent)}% vs prev period
              </span>
            ) : (
              <span className="kpi-comparison neutral">Current matching period</span>
            )}
            <span className="kpi-link-hint">
              View <ChevronRight size={12} />
            </span>
          </div>
        </div>

        {/* KPI 2: Total Final Reports */}
        <div
          className="kpi-card"
          onClick={() => navigate('/final-report')}
          role="button"
          tabIndex={0}
        >
          <div>
            <div className="kpi-card-header">
              <span className="kpi-title">Total Final Reports</span>
              <div className="kpi-icon-badge emerald">
                <FileCheck size={20} />
              </div>
            </div>
            {loading ? (
              <div className="skeleton-line skeleton-kpi-value" />
            ) : (
              <h3 className="kpi-value">{overview?.kpi_final_reports?.value ?? 0}</h3>
            )}
          </div>
          <div className="kpi-footer">
            {overview?.kpi_final_reports?.growth_percent !== null && overview?.kpi_final_reports?.growth_percent !== undefined ? (
              <span className={`kpi-comparison ${overview.kpi_final_reports.growth_percent >= 0 ? 'positive' : 'negative'}`}>
                {overview.kpi_final_reports.growth_percent >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                {Math.abs(overview.kpi_final_reports.growth_percent)}% vs prev period
              </span>
            ) : (
              <span className="kpi-comparison neutral">Current matching period</span>
            )}
            <span className="kpi-link-hint">
              View <ChevronRight size={12} />
            </span>
          </div>
        </div>

        {/* KPI 3: Total Client Value */}
        <div
          className="kpi-card"
          onClick={() => navigate('/final-report')}
          role="button"
          tabIndex={0}
        >
          <div>
            <div className="kpi-card-header">
              <span className="kpi-title">Total Client Value</span>
              <div className="kpi-icon-badge navy">
                <Coins size={20} />
              </div>
            </div>
            {loading ? (
              <div className="skeleton-line skeleton-kpi-value" />
            ) : (
              <h3 className="kpi-value" style={{ fontSize: '24px' }}>
                {formatINR(overview?.kpi_client_value?.value || 0)}
              </h3>
            )}
          </div>
          <div className="kpi-footer">
            {overview?.kpi_client_value?.growth_percent !== null && overview?.kpi_client_value?.growth_percent !== undefined ? (
              <span className={`kpi-comparison ${overview.kpi_client_value.growth_percent >= 0 ? 'positive' : 'negative'}`}>
                {overview.kpi_client_value.growth_percent >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                {Math.abs(overview.kpi_client_value.growth_percent)}% vs prev period
              </span>
            ) : (
              <span className="kpi-comparison neutral">Final Reports Gross Value</span>
            )}
            <span className="kpi-link-hint">
              View <ChevronRight size={12} />
            </span>
          </div>
        </div>

        {/* KPI 4: Total Net Profit */}
        <div
          className="kpi-card"
          onClick={() => navigate('/final-report')}
          role="button"
          tabIndex={0}
        >
          <div>
            <div className="kpi-card-header">
              <span className="kpi-title">Total Net Profit</span>
              <div className="kpi-icon-badge purple">
                <TrendingUp size={20} />
              </div>
            </div>
            {loading ? (
              <div className="skeleton-line skeleton-kpi-value" />
            ) : (
              <h3
                className="kpi-value"
                style={{
                  fontSize: '24px',
                  color: (overview?.kpi_net_profit?.value || 0) < 0 ? '#DC2626' : '#14283F'
                }}
              >
                {formatINR(overview?.kpi_net_profit?.value || 0)}
              </h3>
            )}
          </div>
          <div className="kpi-footer">
            {overview?.kpi_net_profit?.growth_percent !== null && overview?.kpi_net_profit?.growth_percent !== undefined ? (
              <span className={`kpi-comparison ${overview.kpi_net_profit.growth_percent >= 0 ? 'positive' : 'negative'}`}>
                {overview.kpi_net_profit.growth_percent >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                {Math.abs(overview.kpi_net_profit.growth_percent)}% vs prev period
              </span>
            ) : (
              <span className="kpi-comparison neutral">Calculated Net Margin</span>
            )}
            <span className="kpi-link-hint">
              View <ChevronRight size={12} />
            </span>
          </div>
        </div>
      </div>

      {/* 3. CHARTS & PANELS LAYOUT */}
      <div className="dashboard-grid-2-col">
        {/* Interactive Financial Performance Graph */}
        <div className="dashboard-panel">
          <div className="panel-header">
            <div className="panel-title-group">
              <h2>Financial Performance</h2>
              <p className="panel-subtitle">Revenue, Expense, and Net Profit timeline based on saved Final Reports</p>
            </div>
            <Link to="/final-report" className="panel-header-action">
              View Reports <ExternalLink size={13} />
            </Link>
          </div>

          <div className="chart-container-box">
            {chartData && chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={320}>
                <AreaChart
                  data={chartData}
                  margin={{ top: 10, right: 20, left: 10, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="clientValGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#374151" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#374151" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#9CA3AF" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#9CA3AF" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#111827" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#111827" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis
                    dataKey="label"
                    tick={{ fill: '#6B7280', fontSize: 11 }}
                    stroke="#E5E7EB"
                  />
                  <YAxis
                    tick={{ fill: '#6B7280', fontSize: 11 }}
                    stroke="#E5E7EB"
                    tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="custom-chart-tooltip">
                            <div className="tooltip-label">{label}</div>
                            {payload.map((item, idx) => (
                              <div key={idx} className="tooltip-item">
                                <span style={{ color: item.color, fontWeight: 600 }}>{item.name}:</span>
                                <span style={{ fontWeight: 700 }}>{formatINR(item.value)}</span>
                              </div>
                            ))}
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend
                    verticalAlign="top"
                    align="right"
                    wrapperStyle={{ paddingBottom: 12, fontSize: 12 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="client_value"
                    name="Client Value"
                    stroke="#374151"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#clientValGrad)"
                  />
                  <Area
                    type="monotone"
                    dataKey="dmc_expense"
                    name="DMC Expense"
                    stroke="#6B7280"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#expenseGrad)"
                  />
                  <Area
                    type="monotone"
                    dataKey="net_profit"
                    name="Net Profit"
                    stroke="#111827"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#profitGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="chart-empty-state">
                <AlertCircle size={32} className="chart-empty-icon" />
                <p>No financial data available for the selected period.</p>
              </div>
            )}
          </div>
        </div>

        {/* Report Status Overview */}
        <div className="dashboard-panel">
          <div className="panel-header">
            <div className="panel-title-group">
              <h2>Report Status</h2>
              <p className="panel-subtitle">Lifecycle tracking of booked tours</p>
            </div>
            <Link to="/final-report" className="panel-header-action">
              View All <ChevronRight size={13} />
            </Link>
          </div>

          <div className="status-overview-content">
            {/* Completion rate bar */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13, fontWeight: 600 }}>
                <span>Final Completion Rate</span>
                <span style={{ color: '#059669' }}>{reportStatus?.completion_rate || 0}%</span>
              </div>
              <div className="status-progress-track">
                <div
                  className="status-progress-fill"
                  style={{ width: `${Math.min(100, Math.max(0, reportStatus?.completion_rate || 0))}%` }}
                />
              </div>
            </div>

            <div className="status-metrics-list">
              <Link to="/first-report" className="status-metric-row">
                <div className="status-metric-left">
                  <div className="status-indicator-dot blue" />
                  <span className="status-metric-label">Total First Reports</span>
                </div>
                <span className="status-metric-val">{reportStatus?.total_first_reports || 0}</span>
              </Link>

              <Link to="/final-report" className="status-metric-row">
                <div className="status-metric-left">
                  <div className="status-indicator-dot green" />
                  <span className="status-metric-label">Completed Final Reports</span>
                </div>
                <span className="status-metric-val">{reportStatus?.completed_final_reports || 0}</span>
              </Link>

              <Link to="/final-report" className="status-metric-row">
                <div className="status-metric-left">
                  <div className="status-indicator-dot amber" />
                  <span className="status-metric-label">Pending Final Reports</span>
                </div>
                <span className="status-metric-val">{reportStatus?.pending_final_reports || 0}</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* 4. CLIENT & SUPPLIER PAYMENT OVERVIEW (SIDE BY SIDE) */}
      <div className="payment-overview-grid">
        {/* Client Payment Overview */}
        <div className="dashboard-panel">
          <div className="panel-header">
            <div className="panel-title-group">
              <div className="panel-title-with-icon">
                <div className="panel-header-icon-box peach">
                  <Wallet size={18} />
                </div>
                <div>
                  <h2>Client Payment Overview</h2>
                  <p className="panel-subtitle">Reconciliation of client billings and collections</p>
                </div>
              </div>
            </div>
            <Link to="/final-report" className="panel-header-action">
              Final Reports <ExternalLink size={13} />
            </Link>
          </div>

          <div className="payment-card-list">
            <div className="payment-row-item">
              <div className="payment-label-group">
                <span className="payment-label-title">Total Client Amount</span>
                <span className="payment-label-hint">Gross Services billed to client</span>
              </div>
              <span className="payment-amount-val">
                {formatINR(paymentSummary?.client_payments?.total_client_amount || 0)}
              </span>
            </div>

            <div className="payment-row-item">
              <div className="payment-label-group">
                <span className="payment-label-title">Total Collected</span>
                <span className="payment-label-hint">Recorded client payment collections</span>
              </div>
              <span className="payment-amount-val positive">
                {formatINR(paymentSummary?.client_payments?.total_collected || 0)}
              </span>
            </div>

            <div className="payment-row-item highlight">
              <div className="payment-label-group">
                <span className="payment-label-title">Yet to Receive</span>
                <span className="payment-label-hint">Outstanding receivables from clients</span>
              </div>
              <span className={`payment-amount-val ${(paymentSummary?.client_payments?.yet_to_receive || 0) > 0 ? 'pending' : 'positive'}`}>
                {formatINR(paymentSummary?.client_payments?.yet_to_receive || 0)}
              </span>
            </div>
          </div>
        </div>

        {/* Supplier Payment Overview */}
        <div className="dashboard-panel">
          <div className="panel-header">
            <div className="panel-title-group">
              <div className="panel-title-with-icon">
                <div className="panel-header-icon-box green">
                  <Wallet size={18} />
                </div>
                <div>
                  <h2>Supplier Payment Overview</h2>
                  <p className="panel-subtitle">Vendor, DMC and Service provider outstandings</p>
                </div>
              </div>
            </div>
            <Link to="/final-report" className="panel-header-action">
              Final Reports <ExternalLink size={13} />
            </Link>
          </div>

          <div className="payment-card-list">
            <div className="payment-row-item">
              <div className="payment-label-group">
                <span className="payment-label-title">Total to Supplier</span>
                <span className="payment-label-hint">Grand Total of DMC & vendor services</span>
              </div>
              <span className="payment-amount-val">
                {formatINR(paymentSummary?.supplier_payments?.total_to_supplier || 0)}
              </span>
            </div>

            <div className="payment-row-item">
              <div className="payment-label-group">
                <span className="payment-label-title">Total Paid to Supplier</span>
                <span className="payment-label-hint">Disbursed payment spent total</span>
              </div>
              <span className="payment-amount-val positive">
                {formatINR(paymentSummary?.supplier_payments?.total_paid_to_supplier || 0)}
              </span>
            </div>

            <div className="payment-row-item highlight">
              <div className="payment-label-group">
                <span className="payment-label-title">Yet to Supplier</span>
                <span className="payment-label-hint">Pending payables to DMCs and vendors</span>
              </div>
              <span className={`payment-amount-val ${(paymentSummary?.supplier_payments?.yet_to_supplier || 0) > 0 ? 'pending' : 'positive'}`}>
                {formatINR(paymentSummary?.supplier_payments?.yet_to_supplier || 0)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 5. RECENT REPORTS TABLES */}
      <div className="tables-grid">
        {/* Recent First Reports */}
        <div className="dashboard-panel">
          <div className="panel-header">
            <div className="panel-title-group">
              <h2>Recent First Reports</h2>
              <p className="panel-subtitle">Latest booking entries saved in First Report</p>
            </div>
            <Link to="/first-report" className="panel-header-action">
              View All <ChevronRight size={13} />
            </Link>
          </div>

          <div className="table-responsive-wrapper">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>CRM ID</th>
                  <th>Guest Name</th>
                  <th>Destination</th>
                  <th>Branch</th>
                  <th>Report Date</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {recentReports.first_reports && recentReports.first_reports.length > 0 ? (
                  recentReports.first_reports.map((r) => (
                    <tr key={r.id}>
                      <td><span className="crm-badge">{r.crm_id}</span></td>
                      <td className="guest-name">{r.guest_name}</td>
                      <td className="dest-text">{r.destination}</td>
                      <td>{r.branch}</td>
                      <td>{formatDate(r.report_date || r.date_of_travel || r.travel_date)}</td>
                      <td>
                        <span className={`status-tag ${r.status === 'Completed' ? 'completed' : 'pending'}`}>
                          {r.status}
                        </span>
                      </td>
                      <td>
                        <Link to={`/first-report/${r.id}/view`} className="erp-view-button table-action-link">
                          <Eye size={13} />
                          <span>View Details</span>
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="empty-table-row">No First Reports found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Final Reports */}
        <div className="dashboard-panel">
          <div className="panel-header">
            <div className="panel-title-group">
              <h2>Recent Final Reports</h2>
              <p className="panel-subtitle">Latest confirmed Final Reports with financial totals</p>
            </div>
            <Link to="/final-report" className="panel-header-action">
              View All <ChevronRight size={13} />
            </Link>
          </div>

          <div className="table-responsive-wrapper">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>CRM ID</th>
                  <th>Guest Name</th>
                  <th>Destination</th>
                  <th>Client Value</th>
                  <th>Net Profit</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {recentReports.final_reports && recentReports.final_reports.length > 0 ? (
                  recentReports.final_reports.map((r) => (
                    <tr key={r.id}>
                      <td><span className="crm-badge">{r.crm_id}</span></td>
                      <td className="guest-name">{r.guest_name}</td>
                      <td className="dest-text">{r.destination}</td>
                      <td style={{ fontWeight: 600 }}>{formatINR(r.client_value)}</td>
                      <td style={{
                        fontWeight: 600,
                        color: Number(r.net_profit) < 0 ? '#DC2626' : '#059669'
                      }}>
                        {formatINR(r.net_profit)}
                      </td>
                      <td>
                        <span className="status-tag completed">Confirmed</span>
                      </td>
                      <td>
                        <Link to={`/final-report/${r.id}/view`} className="erp-view-button table-action-link">
                          <Eye size={13} />
                          <span>View Details</span>
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="empty-table-row">No Final Reports found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 6. UPCOMING TOURS TABLE */}
      <div className="dashboard-panel" style={{ marginBottom: 0 }}>
        <div className="panel-header">
          <div className="panel-title-group">
            <h2>Upcoming Tours</h2>
            <p className="panel-subtitle">Tours scheduled for travel today or in the future</p>
          </div>
          <span style={{ fontSize: '12px', color: '#64748B', fontWeight: 500 }}>
            {upcomingTours.length} upcoming departure{upcomingTours.length === 1 ? '' : 's'}
          </span>
        </div>

        <div className="table-responsive-wrapper">
          <table className="dashboard-table">
            <thead>
              <tr>
                <th>CRM ID</th>
                <th>Guest Name</th>
                <th>Destination</th>
                <th>Travel Date</th>
                <th>Total Pax</th>
                <th>Branch</th>
                <th>Tour Type</th>
                <th>Days Remaining</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {upcomingTours && upcomingTours.length > 0 ? (
                upcomingTours.map((tour) => (
                  <tr key={`${tour.crm_id}-${tour.id}`}>
                    <td><span className="crm-badge">{tour.crm_id}</span></td>
                    <td className="guest-name">{tour.guest_name}</td>
                    <td className="dest-text">{tour.destination}</td>
                    <td>{formatDate(tour.travel_date)}</td>
                    <td style={{ fontWeight: 600 }}>{tour.total_pax}</td>
                    <td>{tour.branch}</td>
                    <td>{tour.tour_type}</td>
                    <td>
                      <span className={`days-tag ${tour.days_remaining === 0 ? 'today' : 'upcoming'}`}>
                        <Clock size={12} style={{ marginRight: 4 }} />
                        {tour.days_remaining === 0
                          ? 'Today'
                          : `${tour.days_remaining} day${tour.days_remaining === 1 ? '' : 's'} left`}
                      </span>
                    </td>
                    <td>
                      <Link
                        to={(tour.source === 'FinalReport' || tour.type === 'final_report') ? `/final-report/${tour.id}/view` : `/first-report/${tour.id}/view`}
                        className="erp-view-button table-action-link"
                      >
                        <Eye size={13} />
                        <span>View Details</span>
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="empty-table-row">No upcoming tours found for the selected filters.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
