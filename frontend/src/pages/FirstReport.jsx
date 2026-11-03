import React, { useState } from 'react';
import { 
  Save, 
  RotateCcw, 
  CheckCircle2, 
  AlertCircle
} from 'lucide-react';
import { firstReportService } from '../services/api';
import DatePicker from '../components/DatePicker';
import './FirstReport.css';

const INITIAL_FORM_STATE = {
  // Section 1 – Tour Confirmation Details
  report_date: new Date().toISOString().split('T')[0],
  travel_date: '',
  tour_type: 'International',
  crm_id: '',
  sales_by: '',
  branch: 'Coimbatore',

  // Section 2 – Guest & Tour Details
  guest_name: '',
  mobile_no: '',
  dob: '',
  email_id: '',
  adults: 0,
  child: 0,
  total_pax: 0,
  client_type: 'Family',
  destination: '',
  duration: 1,
  rooms: 1,
};

const FirstReport = () => {
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Dropdown options
  const tourTypeOptions = ['International', 'Domestic'];
  const branchOptions = ['Coimbatore', 'Chennai', 'Erode', 'Tiruppur', 'Salem'];
  const clientTypeOptions = ['Family', 'Couple', 'Friends', 'Corporate', 'Group', 'Solo'];

  // Current date for DOB max constraint
  const todayIso = new Date().toISOString().split('T')[0];

  // Generic handler for input changes
  const handleChange = (e) => {
    const { name, value, type } = e.target;

    // Clear specific field error on edit
    if (errors[name]) {
      setErrors((prev) => {
        const newErrs = { ...prev };
        delete newErrs[name];
        return newErrs;
      });
    }

    // Special handling for CRM ID (Numbers only, typed as text/numeric)
    if (name === 'crm_id') {
      const numericOnly = value.replace(/\D/g, '');
      setFormData((prev) => ({
        ...prev,
        crm_id: numericOnly,
      }));
      return;
    }

    // Special handling for Mobile No (Numbers only, max 10 digits)
    if (name === 'mobile_no') {
      const numericOnly = value.replace(/\D/g, '').slice(0, 10);
      setFormData((prev) => ({
        ...prev,
        mobile_no: numericOnly,
      }));
      return;
    }

    // Special handling for Adults and Child numeric inputs
    if (type === 'number') {
      const numVal = Math.max(0, parseInt(value, 10) || 0);
      setFormData((prev) => {
        const updated = { ...prev, [name]: numVal };
        if (name === 'adults' || name === 'child') {
          const currentAdults = name === 'adults' ? numVal : (prev.adults || 0);
          const currentChild = name === 'child' ? numVal : (prev.child || 0);
          updated.total_pax = currentAdults + currentChild;
        }
        return updated;
      });
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Client-side validation before submission
  const validateForm = () => {
    const newErrors = {};

    // Section 1 validation
    if (!formData.report_date) {
      newErrors.report_date = 'Date is required';
    }
    if (!formData.travel_date) {
      newErrors.travel_date = 'Date of Travel is required';
    }
    if (!formData.tour_type) {
      newErrors.tour_type = 'Tour Type is required';
    }
    if (!formData.crm_id.trim()) {
      newErrors.crm_id = 'CRM ID is required';
    } else if (!/^\d+$/.test(formData.crm_id.trim())) {
      newErrors.crm_id = 'CRM ID must contain digits only';
    }
    if (!formData.sales_by.trim()) {
      newErrors.sales_by = 'Sales By is required';
    }
    if (!formData.branch) {
      newErrors.branch = 'Branch is required';
    }

    // Section 2 validation - Left Column
    if (!formData.guest_name.trim()) {
      newErrors.guest_name = 'Guest Name is required';
    }
    if (!formData.mobile_no.trim()) {
      newErrors.mobile_no = 'Mobile No is required';
    } else {
      const cleanPhone = formData.mobile_no.replace(/\D/g, '');
      if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
        newErrors.mobile_no = 'Enter a valid 10-digit Indian mobile number';
      }
    }
    if (formData.dob && formData.dob > todayIso) {
      newErrors.dob = 'Date of Birth cannot be in the future';
    }
    if (formData.email_id && formData.email_id.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email_id.trim())) {
        newErrors.email_id = 'Enter a valid email address';
      }
    }

    // Section 2 validation - Middle Column
    if ((formData.adults || 0) + (formData.child || 0) <= 0) {
      newErrors.adults = 'At least 1 passenger is required (Adult or Child)';
    }

    // Section 2 validation - Right Column
    if (!formData.client_type) {
      newErrors.client_type = 'Client Type is required';
    }
    if (!formData.destination.trim()) {
      newErrors.destination = 'Destination is required';
    }
    if (!formData.duration || formData.duration < 1) {
      newErrors.duration = 'Duration must be at least 1 day';
    }
    if (!formData.rooms || formData.rooms < 1) {
      newErrors.rooms = 'Rooms must be at least 1';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMessage('');
    setErrorMessage('');

    if (!validateForm()) {
      setErrorMessage('Please check the highlighted fields and correct the errors.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        ...formData,
        dob: formData.dob || null,
        email_id: formData.email_id.trim() || null,
        crm_id: formData.crm_id.trim(),
        guest_name: formData.guest_name.trim(),
        sales_by: formData.sales_by.trim(),
        destination: formData.destination.trim(),
      };

      const response = await firstReportService.create(payload);
      setSuccessMessage(`First Report saved successfully for CRM ID: ${response.data?.crm_id || payload.crm_id}`);
      setErrorMessage('');
      setErrors({});
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error('Error saving first report:', err);
      if (err.response && err.response.data) {
        const backendErrors = err.response.data.errors || err.response.data;
        if (typeof backendErrors === 'object') {
          const formatted = {};
          Object.keys(backendErrors).forEach((key) => {
            const val = backendErrors[key];
            formatted[key] = Array.isArray(val) ? val.join(' ') : String(val);
          });
          setErrors(formatted);
          setErrorMessage(err.response.data.message || 'Validation failed on server. Please check errors below.');
        } else {
          setErrorMessage(err.response.data.message || 'An error occurred while saving the report.');
        }
      } else {
        setErrorMessage('Unable to connect to the backend server. Please verify the Django API is running.');
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset form
  const handleReset = () => {
    setFormData({
      ...INITIAL_FORM_STATE,
      report_date: new Date().toISOString().split('T')[0],
      adults: 0,
      child: 0,
      total_pax: 0,
    });
    setErrors({});
    setSuccessMessage('');
    setErrorMessage('');
  };

  return (
    <div className="first-report-page">
      {/* Top Header Banner */}
      <div className="first-report-header">
        <h1 className="company-title">ASPIRE TOURISM INDIA PVT LTD - FIRST REPORT</h1>
        <h2 className="sheet-subtitle">Tour Confirmation Sheet</h2>
      </div>

      {/* Notifications */}
      {successMessage && (
        <div className="alert-box alert-success" role="alert">
          <CheckCircle2 size={20} className="alert-icon" />
          <div className="alert-text-wrapper">
            <span className="alert-title">Success!</span>
            <span className="alert-desc">{successMessage}</span>
          </div>
        </div>
      )}

      {/* Notifications */}
      {errorMessage && (
        <div className="alert-box alert-danger" role="alert">
          <AlertCircle size={20} className="alert-icon" />
          <div className="alert-text-wrapper">
            <span className="alert-title">Notice</span>
            <span className="alert-desc">{errorMessage}</span>
          </div>
        </div>
      )}

      {/* Exactly TWO separate DIV sections */}
      <form onSubmit={handleSubmit} noValidate className="first-report-form">
        
        {/* ========================================================= */}
        {/* FIRST DIV – Tour Confirmation Details                     */}
        {/* ========================================================= */}
        <div className="report-section">
          <h3 className="section-heading">
            Tour Confirmation Details
          </h3>

          <div className="report-grid">
            {/* Row 1, Col 1: Date */}
            <div className="report-field">
              <label htmlFor="report_date">
                Date <span className="req">*</span>
              </label>
              <DatePicker
                id="report_date"
                name="report_date"
                value={formData.report_date}
                onChange={handleChange}
                className={errors.report_date ? 'is-invalid' : ''}
                required
              />
              {errors.report_date && <span className="field-error-msg">{errors.report_date}</span>}
            </div>

            {/* Row 1, Col 2: Date of Travel */}
            <div className="report-field">
              <label htmlFor="travel_date">
                Date of Travel <span className="req">*</span>
              </label>
              <DatePicker
                id="travel_date"
                name="travel_date"
                value={formData.travel_date}
                onChange={handleChange}
                className={errors.travel_date ? 'is-invalid' : ''}
                required
              />
              {errors.travel_date && <span className="field-error-msg">{errors.travel_date}</span>}
            </div>

            {/* Row 1, Col 3: Tour Type */}
            <div className="report-field">
              <label htmlFor="tour_type">
                Tour Type <span className="req">*</span>
              </label>
              <div className="dropdown-wrapper">
                <select
                  id="tour_type"
                  name="tour_type"
                  value={formData.tour_type}
                  onChange={handleChange}
                  className={`custom-dropdown ${errors.tour_type ? 'error is-invalid' : ''}`}
                  required
                >
                  {tourTypeOptions.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
              {errors.tour_type && <span className="field-error-msg">{errors.tour_type}</span>}
            </div>

            {/* Row 2, Col 1: CRM ID */}
            <div className="report-field">
              <label htmlFor="crm_id">
                CRM ID <span className="req">*</span>
              </label>
              <input
                type="text"
                id="crm_id"
                name="crm_id"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="e.g. 8985"
                value={formData.crm_id}
                onChange={handleChange}
                className={`form-control ${errors.crm_id ? 'is-invalid' : ''}`}
                required
              />
              {errors.crm_id && <span className="field-error-msg">{errors.crm_id}</span>}
            </div>

            {/* Row 2, Col 2: Sales By */}
            <div className="report-field">
              <label htmlFor="sales_by">
                Sales By <span className="req">*</span>
              </label>
              <input
                type="text"
                id="sales_by"
                name="sales_by"
                placeholder="Sales Executive Name"
                value={formData.sales_by}
                onChange={handleChange}
                className={`form-control ${errors.sales_by ? 'is-invalid' : ''}`}
                required
              />
              {errors.sales_by && <span className="field-error-msg">{errors.sales_by}</span>}
            </div>

            {/* Row 2, Col 3: Branch */}
            <div className="report-field">
              <label htmlFor="branch">
                Branch <span className="req">*</span>
              </label>
              <div className="dropdown-wrapper">
                <select
                  id="branch"
                  name="branch"
                  value={formData.branch}
                  onChange={handleChange}
                  className={`custom-dropdown ${errors.branch ? 'error is-invalid' : ''}`}
                  required
                >
                  {branchOptions.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>
              {errors.branch && <span className="field-error-msg">{errors.branch}</span>}
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* SECOND DIV – Guest & Tour Details                         */}
        {/* ========================================================= */}
        <div className="report-section">
          <h3 className="section-heading">
            Guest & Tour Details
          </h3>

          <div className="report-grid">

            {/* Left Column */}
            <div className="report-column">
              {/* Guest Name */}
              <div className="report-field">
                <label htmlFor="guest_name">
                  Guest Name <span className="req">*</span>
                </label>
                <input
                  type="text"
                  id="guest_name"
                  name="guest_name"
                  placeholder="Full Name of Primary Guest"
                  value={formData.guest_name}
                  onChange={handleChange}
                  className={`form-control ${errors.guest_name ? 'is-invalid' : ''}`}
                  required
                />
                {errors.guest_name && <span className="field-error-msg">{errors.guest_name}</span>}
              </div>

              {/* Mobile No */}
              <div className="report-field">
                <label htmlFor="mobile_no">
                  Mobile No <span className="req">*</span>
                </label>
                <input
                  type="tel"
                  id="mobile_no"
                  name="mobile_no"
                  inputMode="numeric"
                  maxLength={10}
                  placeholder="10-digit mobile number"
                  value={formData.mobile_no}
                  onChange={handleChange}
                  className={`form-control ${errors.mobile_no ? 'is-invalid' : ''}`}
                  required
                />
                {errors.mobile_no && <span className="field-error-msg">{errors.mobile_no}</span>}
              </div>

              {/* DOB */}
              <div className="report-field">
                <label htmlFor="dob">
                  DOB
                </label>
                <DatePicker
                  id="dob"
                  name="dob"
                  value={formData.dob}
                  onChange={handleChange}
                  maxDate={todayIso}
                  placeholder="DD/MM/YYYY"
                  className={errors.dob ? 'is-invalid' : ''}
                />
                {errors.dob && <span className="field-error-msg">{errors.dob}</span>}
              </div>

              {/* Email ID */}
              <div className="report-field">
                <label htmlFor="email_id">
                  Email ID
                </label>
                <input
                  type="email"
                  id="email_id"
                  name="email_id"
                  placeholder="e.g. guest@example.com"
                  value={formData.email_id}
                  onChange={handleChange}
                  className={`form-control ${errors.email_id ? 'is-invalid' : ''}`}
                />
                {errors.email_id && <span className="field-error-msg">{errors.email_id}</span>}
              </div>
            </div>

            {/* Middle Column */}
            <div className="report-column">
              {/* Adults */}
              <div className="report-field">
                <label htmlFor="adults">
                  Adults <span className="req">*</span>
                </label>
                <input
                  type="number"
                  id="adults"
                  name="adults"
                  min="0"
                  value={formData.adults}
                  onChange={handleChange}
                  className={`form-control ${errors.adults ? 'is-invalid' : ''}`}
                  required
                />
                {errors.adults && <span className="field-error-msg">{errors.adults}</span>}
              </div>

              {/* Child */}
              <div className="report-field">
                <label htmlFor="child">
                  Child
                </label>
                <input
                  type="number"
                  id="child"
                  name="child"
                  min="0"
                  value={formData.child}
                  onChange={handleChange}
                  className={`form-control ${errors.child ? 'is-invalid' : ''}`}
                />
                {errors.child && <span className="field-error-msg">{errors.child}</span>}
              </div>

              {/* Total Pax */}
              <div className="report-field">
                <label htmlFor="total_pax">
                  Total Pax
                </label>
                <input
                  type="number"
                  id="total_pax"
                  name="total_pax"
                  value={formData.total_pax}
                  readOnly
                  className="form-control"
                  title="Automatically calculated (Adults + Child)"
                />
                <span className="field-hint-msg">Auto-calculated: Adults + Child</span>
              </div>

              {/* Fourth row – Empty to align columns */}
              <div className="report-field report-field-empty" aria-hidden="true"></div>
            </div>

            {/* Right Column */}
            <div className="report-column">
              {/* Client Type */}
              <div className="report-field">
                <label htmlFor="client_type">
                  Client Type <span className="req">*</span>
                </label>
                <div className="dropdown-wrapper">
                  <select
                    id="client_type"
                    name="client_type"
                    value={formData.client_type}
                    onChange={handleChange}
                    className={`custom-dropdown ${errors.client_type ? 'error is-invalid' : ''}`}
                    required
                  >
                    {(formData.client_type === 'Corporate Group' ? [...clientTypeOptions, 'Corporate Group'] : clientTypeOptions).map((ct) => (
                      <option key={ct} value={ct}>{ct}</option>
                    ))}
                  </select>
                </div>
                {errors.client_type && <span className="field-error-msg">{errors.client_type}</span>}
              </div>

              {/* Destination */}
              <div className="report-field">
                <label htmlFor="destination">
                  Destination <span className="req">*</span>
                </label>
                <input
                  type="text"
                  id="destination"
                  name="destination"
                  placeholder="e.g. Dubai, Switzerland, Kashmir"
                  value={formData.destination}
                  onChange={handleChange}
                  className={`form-control ${errors.destination ? 'is-invalid' : ''}`}
                  required
                />
                {errors.destination && <span className="field-error-msg">{errors.destination}</span>}
              </div>

              {/* Duration */}
              <div className="report-field">
                <label htmlFor="duration">
                  Duration (Days) <span className="req">*</span>
                </label>
                <input
                  type="number"
                  id="duration"
                  name="duration"
                  min="1"
                  value={formData.duration}
                  onChange={handleChange}
                  className={`form-control ${errors.duration ? 'is-invalid' : ''}`}
                  required
                />
                {errors.duration && <span className="field-error-msg">{errors.duration}</span>}
              </div>

              {/* Rooms */}
              <div className="report-field">
                <label htmlFor="rooms">
                  Rooms <span className="req">*</span>
                </label>
                <input
                  type="number"
                  id="rooms"
                  name="rooms"
                  min="1"
                  value={formData.rooms}
                  onChange={handleChange}
                  className={`form-control ${errors.rooms ? 'is-invalid' : ''}`}
                  required
                />
                {errors.rooms && <span className="field-error-msg">{errors.rooms}</span>}
              </div>
            </div>

          </div>
        </div>

        {/* ========================================================= */}
        {/* Existing Save and Reset Buttons                           */}
        {/* ========================================================= */}
        <div className="form-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleReset}
            disabled={isSubmitting}
            id="reset-form-btn"
          >
            <RotateCcw size={17} />
            <span>Reset Form</span>
          </button>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={isSubmitting}
            id="save-report-btn"
          >
            <Save size={17} />
            <span>{isSubmitting ? 'Saving...' : 'Save Report'}</span>
          </button>
        </div>

      </form>
    </div>
  );
};

export default FirstReport;
