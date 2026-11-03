import apiClient from './api';

// 1. Overview KPIs (4 Main KPI containers + previous period trends)
export const getDashboardOverview = async (params = {}) => {
  return await apiClient.get('/dashboard/overview/', { params });
};

// 2. Financial Chart data
export const getFinancialChartData = async (params = {}) => {
  return await apiClient.get('/dashboard/financial-chart/', { params });
};

// 3. Report Status Overview (First Reports vs Completed / Pending Final Reports)
export const getReportStatusOverview = async (params = {}) => {
  return await apiClient.get('/dashboard/report-status/', { params });
};

// 4. Payment Overview (Client & Supplier balances)
export const getPaymentSummary = async (params = {}) => {
  return await apiClient.get('/dashboard/payment-summary/', { params });
};

// 5. Recent First Reports & Final Reports
export const getRecentReports = async (params = {}) => {
  return await apiClient.get('/dashboard/recent-reports/', { params });
};

// 6. Upcoming Tours
export const getUpcomingTours = async (params = {}) => {
  return await apiClient.get('/dashboard/upcoming-tours/', { params });
};

export const dashboardService = {
  getOverview: getDashboardOverview,
  getFinancialChart: getFinancialChartData,
  getReportStatus: getReportStatusOverview,
  getPaymentSummary: getPaymentSummary,
  getRecentReports: getRecentReports,
  getUpcomingTours: getUpcomingTours,
};

export default dashboardService;
