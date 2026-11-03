import React, { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { firstReportService } from '../services/firstReportApi';
import { finalReportService } from '../services/finalReportApi';

/**
 * Reusable DownloadPDFButton Component
 *
 * Props:
 * - reportType: 'first' | 'final'
 * - reportId: string | number
 * - crmId: string | number (optional, used for fallback filename)
 * - variant: 'icon' (table action button) | 'button' (page action button with text)
 * - className: additional CSS class names
 * - title: tooltip title
 */
const DownloadPDFButton = ({
  reportType = 'first',
  reportId,
  crmId,
  variant = 'button',
  className = '',
  title = 'Download PDF',
  children,
}) => {
  const [loading, setLoading] = useState(false);

  const handleDownload = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (loading || !reportId) return;

    setLoading(true);
    try {
      let response;
      if (reportType === 'final') {
        response = await finalReportService.downloadPdf(reportId);
      } else {
        response = await firstReportService.downloadPdf(reportId);
      }

      // Extract filename from Content-Disposition header if available
      let filename = '';
      const disposition = response.headers ? response.headers['content-disposition'] : '';
      if (disposition && disposition.indexOf('filename=') !== -1) {
        const matches = disposition.match(/filename="?([^";]+)"?/);
        if (matches && matches[1]) {
          filename = matches[1];
        }
      }

      // Default fallback filename if header was stripped by CORS
      if (!filename) {
        const cleanCrm = String(crmId || reportId).replace(/\s+/g, '_');
        filename = reportType === 'final'
          ? `CRM_Final_Report_${cleanCrm}.pdf`
          : `CRM_First_Report_${cleanCrm}.pdf`;
      }

      // Trigger browser download via Blob URL
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      console.error('Error downloading report PDF:', err);
      alert('Failed to generate and download the PDF report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (variant === 'icon') {
    return (
      <button
        type="button"
        className={`action-icon-btn pdf-btn ${className}`}
        title={loading ? 'Generating PDF...' : title}
        aria-label={title}
        onClick={handleDownload}
        disabled={loading || !reportId}
        style={{
          color: '#374151',
          transition: 'all 0.15s ease',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {loading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
      </button>
    );
  }

  return (
    <button
      type="button"
      className={`btn-view-action btn-view-pdf ${className}`}
      onClick={handleDownload}
      disabled={loading || !reportId}
      title={title}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        cursor: loading ? 'wait' : 'pointer',
      }}
    >
      {loading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
      <span>{loading ? 'Downloading PDF...' : children || 'Download PDF'}</span>
    </button>
  );
};

export default DownloadPDFButton;
